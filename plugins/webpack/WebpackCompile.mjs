import os from "node:os";
import { getHook } from "../../RunPlugins.mjs";
import { createBuildTrace } from "../../otel/BuildTrace.mjs";
import { dryRun } from "../context-providers/options/Options.mjs";
import webpackContext from "../context-providers/webpack/WebpackContext.mjs";

const webpackCompile = (configs) => {
	if (getHook(dryRun)) {
		return configs;
	}

	// One span per sub-compiler (browser, node) under a "webpack build" root.
	// Sent to the baked-in build collector (see otel/BuildTrace.mjs); OTEL_EXPORTER_OTLP_ENDPOINT="" turns it off.
	// TRACEPARENT (passed in by CI) nests this under the CI build's trace.
	const trace = createBuildTrace({
		name: "webpack build",
		serviceName: "webpack",
		// unset values are dropped; CUSTOMER_URL / PUBLIC_URL are usually unset in docker builds
		attributes: {
			"customer.url": process.env.CUSTOMER_URL,
			"public.url": process.env.PUBLIC_URL,
			"host.name": os.hostname(),
			"host.cpu.count": os.cpus().length,
			"host.memory.total": os.totalmem(),
			"process.runtime.version": process.version,
		},
	});

	return new Promise((resolve, reject) => {
		/** @type { import('webpack').default } */
		const webpack = webpackContext.getStore();

		let compilerRunner;
		try {
			// throws synchronously on an invalid config or a plugin that fails in apply()
			compilerRunner = webpack(configs);
		} catch (error) {
			trace.flush("failure").then(() => reject(error));
			return;
		}

		// Each sub-compiler fires 'done' when its own compilation finishes
		(compilerRunner.compilers ?? [ compilerRunner ]).forEach((subCompiler, index) => {
			let span;
			subCompiler.hooks.compile.tap('BuildTrace', () => {
				span ??= trace.startSpan(`webpack ${subCompiler.name ?? index}`, {
					"webpack.compiler.name": subCompiler.name,
				});
			});

			// warnings will be aggregated and logged by compilerRunner.run,
			// but it only logs one subCompiler's errors.
			// We'll tap each subCompiler's .done to print errors as they happen.
			subCompiler.hooks.done.tap('PrintStatsErrors', (stats) => {
				span?.end({
					error: stats.hasErrors(),
					attributes: {
						"webpack.errors": stats.compilation.errors.length,
						"webpack.warnings": stats.compilation.warnings.length,
					},
				});

				if (stats.hasErrors()) {
					console.error(stats.toString('errors'));
				}
			});
		});

		compilerRunner.run((configError, stats) => {
			// we get called after all compilers are done

			if (configError) {
				console.error("configError");
				console.error(configError.stack || configError);
				if (configError.details) {
					console.error(configError.details);
				}

				trace.flush("failure").then(() => reject({ type: "configError", configError }));
				return;
			}

			const info = stats.toJson();

			if (stats.hasErrors()) {
				console.error("Webpack reported stats.hasErrors()");
				console.error(info.errors);
				trace.flush("failure").then(() => reject({ type: "webpack stats.hasErrors()" }));
				return;
			}

			if (stats.hasWarnings()) {
				console.warn("Webpack reported stats.hasWarnings()");
				console.warn(info.warnings);
			}

			console.log("Webpack compiled successfully");
			trace.flush("success").then(() => resolve());
		});
	});
};

const webpackCompileCrumb = Symbol(webpackCompile.name);

export default {
	name: webpackCompile.name,
	main: (config) => webpackCompile(config),
	crumb: webpackCompileCrumb,
};
