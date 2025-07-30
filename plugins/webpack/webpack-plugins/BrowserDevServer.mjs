import WebpackDevServer from "webpack-dev-server";
import { errorLog } from "../../../razzle-libs/logger.mjs";
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
			if (once) {
				// there are two parallel compilations using BrowserDevServerPlugin?
				// without this, we get "Error: listen EADDRINUSE: address already in use 0.0.0.0:81"
				return;
			} else {
				once = true;
			}

			const waitForCleanup = new Promise((resolve, reject) => {
				if (this.clientDevServer) {
					console.log("stopping clientDevServer");
					this.clientDevServer.stop().then(resolve).catch(reject);
				} else {
					resolve();
				}
			});
			waitForCleanup.then(async () => {
				// todo: get this from the compilation's devServer config somehow instead
				const options = browserDevServerConfig();

				// WebpackDevServer API docs: https://webpack.js.org/api/webpack-dev-server/
				const clientDevServer = (this.clientDevServer = new WebpackDevServer(
					options,
					compiler,
				));

				try {
					await clientDevServer.start();

					// without this initial invalidation, HMR doesn't start until you make
					// a code edit. /static/js/client.js will be missing the
					// webpack/hot/dev-server.js require.
					// Alternatively, visiting {client url}/webpack-dev-server/invalidate
					// is the same as making an edit
					clientDevServer.invalidate(() => {
						console.log("HMR startup workaround complete");
					});
					console.log("clientDevServer started");
				} catch (error) {
					console.log("clientDevServer.startCallback error");
					errorLog(error);
				}
			});
		});
	}
}
