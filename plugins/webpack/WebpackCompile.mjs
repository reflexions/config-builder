import { getHook } from "../../RunPlugins.mjs";
import { dryRun } from "../context-providers/options/Options.mjs";
import webpackContext from "../context-providers/webpack/WebpackContext.mjs";

const webpackCompile = (config) => {
	if (getHook(dryRun)) {
		return config;
	}

	return new Promise((resolve, reject) => {
		const webpack = webpackContext.getStore();
		webpack(config, (configError, stats) => {
			// we get called each time a compilation finishes

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
				reject({ type: "webpack stats.hasErrors()", configError });
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
