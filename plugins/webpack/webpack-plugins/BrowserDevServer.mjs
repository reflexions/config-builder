import WebpackDevServer from "webpack-dev-server";
import { errorLog } from "../../../razzle-libs/logger.mjs";
import {
	getHmrClientListenPort,
	getListenHost,
} from "../../context-providers/options/Options.mjs";
import { browserDevServerConfig } from "../hmr/HmrClient.mjs";

let once = false;

/**
 * Webpack will only start a dev server for the first config
 * We want two dev servers: one for the Server-side build, and one for the Client-side build
 * Our webpack config's devServer handles the client-side build; this will handle the server-side
 */
export default class BrowserDevServerPlugin {
	static defaultOptions = {};

	// Any options should be passed in the constructor of your plugin,
	// (this is a public API of your plugin).
	constructor(options = {}) {
		// Applying user-specified options over the default options
		// and making merged options further available to the plugin methods.
		// You should probably validate all the options here as well.
		this.options = { ...BrowserDevServerPlugin.defaultOptions, ...options };
	}

	apply(compiler) {
		const pluginName = BrowserDevServerPlugin.name;

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

			console.log("start waitForCleanup");
			const waitForCleanup = new Promise((resolve, reject) => {
				console.log("waitForCleanup");
				if (this.clientDevServer) {
					console.log("stopping clientDevServer");
					this.clientDevServer.stop()
						.then(resolve)
						.catch(reject);
				}
				else {
					console.log("done");
					resolve();
				}
			});
			waitForCleanup.then(() => {
				console.log("creating new WebpackDevServer");
				// todo: get this from the compilation's devServer config somehow instead
				const options = browserDevServerConfig();
				this.clientDevServer = new WebpackDevServer(
					options,
					compiler,
				);
				console.log(options);
				this.clientDevServer.startCallback((err) => {
					if (err) {
						console.log("clientDevServer.startCallback err");
						errorLog(err);
					}
					console.log("clientDevServer started");
				});
			});
		});
	}
}
