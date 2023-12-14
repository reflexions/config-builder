import WebpackDevServer from "webpack-dev-server";
import { errorLog } from "../../../razzle-libs/logger.mjs";
import {
	getHmrClientListenPort,
	getListenHost,
} from "../../context-providers/options/Options.mjs";

let once = false;

/**
 * Webpack will only start a dev server for the first config
 * We want two dev servers: one for Express, and one for the Client-side build
 */
export default class ClientDevServerPlugin {
	static defaultOptions = {};

	// Any options should be passed in the constructor of your plugin,
	// (this is a public API of your plugin).
	constructor(options = {}) {
		// Applying user-specified options over the default options
		// and making merged options further available to the plugin methods.
		// You should probably validate all the options here as well.
		this.options = { ...ClientDevServerPlugin.defaultOptions, ...options };
	}

	apply(compiler) {
		const pluginName = ClientDevServerPlugin.name;

		// webpack module instance can be accessed from the compiler object,
		// this ensures that correct version of the module is used
		// (do not require/import the webpack or any symbols from it directly).
		const { webpack } = compiler;

		compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
			console.log(`${pluginName} Tapped afterCompile`);

			if (once) {
				return;
			}
			else {
				once = true;
			}

			const waitForCleanup = new Promise((resolve, reject) => {
				if (this.clientDevServer) {
					this.clientDevServer.stop().then(resolve).catch(reject);
				}
				else {
					resolve();
				}
			});
			waitForCleanup.then(() => {
				console.log("new WebpackDevServer");
				this.clientDevServer = new WebpackDevServer(
					{
						...compilation.devServer,
						host: getListenHost(),
						port: getHmrClientListenPort(),
						allowedHosts: "all",
						headers: {
							"Access-Control-Allow-Origin": "*",
							"Cross-Origin-Resource-Policy": "same-site",
						},
					},
					compiler,
				);
				this.clientDevServer.startCallback((err) => {
					if (err) {
						console.log("clientDevServer.startCallback err");
						errorLog(err);
					}
					console.log("clientDevServer.startCallback");
				});
			});
		});
	}
}
