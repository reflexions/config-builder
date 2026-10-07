import { readFileSync } from "node:fs";
import os from "node:os";
import { getHook } from "../../RunPlugins.mjs";
import { createBuildTrace } from "../../otel/BuildTrace.mjs";
import { dryRun } from "../context-providers/options/Options.mjs";
import webpackContext from "../context-providers/webpack/WebpackContext.mjs";

// The building project's package.json name. build.mjs runs under plain node, so npm_package_name isn't set.
const packageName = () => {
	try {
		return JSON.parse(readFileSync(`${process.cwd()}/package.json`, "utf8")).name;
	}
	catch {
		return undefined;
	}
};

// "webpack browser" / "webpack node" when the config has no name (the default), from its target
const compilerLabel = (subCompiler, index) => {
	// target: false is valid webpack (no target-specific defaults), so it says nothing about browser vs node
	const { target } = subCompiler.options;
	const targetText = target === undefined || target === false ? "" : String(target);
	return subCompiler.name ?? (targetText.startsWith("node") ? "node" : targetText ? "browser" : index);
};

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
		// SITE / CITY / PHASE are set by the consumers' Dockerfiles and tell repos and sites apart.
		// NODE_ENV is "production" in CI image builds and "development" in local docker builds.
		// CUSTOMER_URL is only set locally (docker.env), where it also names the repo. Unset values are dropped.
		attributes: {
			"app.node_env": process.env.NODE_ENV,
			"customer.url": process.env.CUSTOMER_URL,
			"app.package": packageName(),
			"app.site": process.env.SITE,
			"app.city": process.env.CITY,
			"app.phase": process.env.PHASE,
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
			trace.flush("failure");
			reject(error);
			return;
		}

		// Each sub-compiler fires 'done' when its own compilation finishes
		(compilerRunner.compilers ?? [ compilerRunner ]).forEach((subCompiler, index) => {
			let span;
			subCompiler.hooks.compile.tap('BuildTrace', () => {
				span ??= trace.startSpan(`webpack ${compilerLabel(subCompiler, index)}`, {
					"webpack.compiler.name": subCompiler.name,
					"webpack.target": subCompiler.options.target === undefined ? undefined : String(subCompiler.options.target),
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

				trace.flush("failure");
				reject({ type: "configError", configError });
				return;
			}

			const info = stats.toJson();

			if (stats.hasErrors()) {
				console.error("Webpack reported stats.hasErrors()");
				console.error(info.errors);
				trace.flush("failure");
				reject({ type: "webpack stats.hasErrors()" });
				return;
			}

			if (stats.hasWarnings()) {
				console.warn("Webpack reported stats.hasWarnings()");
				console.warn(info.warnings);
			}

			console.log("Webpack compiled successfully");
			trace.flush("success");
			resolve();
		});
	});
};

const webpackCompileCrumb = Symbol(webpackCompile.name);

export default {
	name: webpackCompile.name,
	main: (config) => webpackCompile(config),
	crumb: webpackCompileCrumb,
};
