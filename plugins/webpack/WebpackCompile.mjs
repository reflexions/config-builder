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

			// First log all the possible messages before rejecting.
			// Otherwise a configError in the server build (like waitForAssetsJson timing out)
			// would mask any stats.hasErrors() from the client build (like css class not defined)

			if (configError) {
				console.error("configError");
				console.error(configError.stack || configError);
				if (configError.details) {
					console.error(configError.details);
				}
			}

			const info = stats.toJson();

			if (stats.hasErrors()) {
				console.error("Webpack reported stats.hasErrors()");
				console.error(info.errors);
			}

			if (stats.hasWarnings()) {
				console.warn("Webpack reported stats.hasWarnings()");
				console.warn(info.warnings);
			}


			if (configError) {
				reject({ type: "configError", configError });
				return;
			}

			if (stats.hasErrors()) {
				reject({ type: "webpack stats.hasErrors()", configError });
				return;
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
