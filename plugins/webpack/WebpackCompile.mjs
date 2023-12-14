import webpack from "webpack";

const webpackCompile = async (config) => {
	return new Promise((resolve, reject) => {
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
				console.error("stats.hasErrors()");
				console.error(info.errors);
				reject({ type: "stats.hasErrors()", configError });
				return;
			}

			if (stats.hasWarnings()) {
				console.warn("stats.hasWarnings()");
				console.warn(info.warnings);
			}

			console.log("Done processing");
			resolve();
		})
	});
};

const webpackCompileCrumb = Symbol(webpackCompile.name);

export default {
	name: webpackCompile.name,
	main: (config) => webpackCompile(config),
	crumb: webpackCompileCrumb,
};
