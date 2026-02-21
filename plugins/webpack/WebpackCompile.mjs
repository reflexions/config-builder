import { getHook } from "../../RunPlugins.mjs";
import { dryRun } from "../context-providers/options/Options.mjs";
import webpackContext from "../context-providers/webpack/WebpackContext.mjs";

const webpackCompile = (configs) => {
	if (getHook(dryRun)) {
		return configs;
	}

	return new Promise((resolve, reject) => {
		/** @type { import('webpack').default } */
		const webpack = webpackContext.getStore();

		const compilerRunner = webpack(configs);

		// Each sub-compiler fires 'done' when its own compilation finishes
		(compilerRunner.compilers ?? [ compilerRunner ]).forEach((subCompiler) => {
			// warnings will be aggregated and logged by compilerRunner.run,
			// but it only logs one subCompiler's errors.
			// We'll tap each subCompiler's .done to print errors as they happen.
			subCompiler.hooks.done.tap('PrintStatsErrors', (stats) => {
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

				reject({ type: "configError", configError });
				return;
			}

			const info = stats.toJson();

			if (stats.hasErrors()) {
				console.error("Webpack reported stats.hasErrors()");
				console.error(info.errors);
				reject({ type: "webpack stats.hasErrors()" });
				return;
			}

			if (stats.hasWarnings()) {
				console.warn("Webpack reported stats.hasWarnings()");
				console.warn(info.warnings);
			}

			console.log("Webpack compiled successfully");
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
