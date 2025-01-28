import {
	getHmrClientPublicUrl,
	getHmrClientListenPort,
	getIsProduction,
	getListenHost,
} from "../../context-providers/options/Options.mjs";
import {
	getIsNode,
} from "../SeparateNodeAndBrowserBuilds.mjs";
import {
	getAppAssetsManifest,
	getConfigBuilderDir,
} from "../../context-providers/paths/Paths.mjs";
import {
	getHook,
	getHookFnResult,
} from "../../../RunPlugins.mjs";
import BrowserDevServerPlugin from "../webpack-plugins/BrowserDevServer.mjs";

export const browserDevServerConfigSymbol = Symbol("browserDevServerConfigSymbol");
export const browserDevServerHeadersSymbol = Symbol("browserDevServerHeadersSymbol");
export const browserDevServerClientOverlaySymbol = Symbol("browserDevServerClientOverlaySymbol");
export const browserDevServerClientProgressSymbol = Symbol("browserDevServerClientProgressSymbol");
export const browserDevServerWatchSymbol = Symbol("browserDevServerWatchSymbol");

export const attachHmrClientSymbol = Symbol("attachHmrClientSymbol");
export const attachHmrClientWatchIgnoreSymbol = Symbol("attachHmrClientWatchIgnoreSymbol");
export const attachHmrClientWatchOptionsSymbol = Symbol("attachHmrClientWatchOptionsSymbol");

export const browserDevServerConfig = () => getHook(browserDevServerConfigSymbol, ({
	compress: true,
	headers: getHook(browserDevServerHeadersSymbol, {
		"Access-Control-Allow-Origin": "*",
		"Cross-Origin-Resource-Policy": "same-site",
	}),
	historyApiFallback: {
		disableDotRule: true,
	},
	hot: true,
	host: getListenHost(),
	port: getHmrClientListenPort(),
	allowedHosts: "all",
	client: {
		logging: 'verbose',
		overlay: getHook(browserDevServerClientOverlaySymbol, false), // on hot reload, shows until both client + dev builds are complete
		progress: getHook(browserDevServerClientProgressSymbol, true),
	},
	devMiddleware: {
		publicPath: getHmrClientPublicUrl().href,
	},
	static: {
		watch: getHook(browserDevServerWatchSymbol, {
			ignored: /node_modules/,
		}),
	},
}));

const attachHmrClientCrumb = Symbol("attachHmrClientCrumb");
const attachHmrClient = async config => await getHookFnResult(attachHmrClientSymbol, async config => {
	const isProduction = getIsProduction();

	if (isProduction) {
		console.warn("attachHmrClient disabled when isProduction");
		return config;
	}

	const isNode = getIsNode();
	return {
		...config,

		entry: {
			...config.entry,

			client: [
				getConfigBuilderDir() + '/plugins/webpack/hmr/webpackHotDevClientV4.cjs',
				...config.entry.client,
			],
		},

		// Per https://webpack.js.org/configuration/dev-server/
		// Be aware that when exporting multiple configurations only the devServer options for the first configuration will be taken into account and used for all the configurations in the array.
		devServer: browserDevServerConfig(),

		plugins: [
			...config.plugins ?? [],

			new BrowserDevServerPlugin(),
		],

		watch: true,
		watchOptions: {
			ignored: [
				...getHook(attachHmrClientWatchIgnoreSymbol, [
					"**/node_modules",
				]),
				getAppAssetsManifest(),
			],

			...getHook(attachHmrClientWatchOptionsSymbol, {
				//aggregateTimeout: 500,
				//poll: false,
			}),
		},
	};
}, [ config ]);

export default {
	name: attachHmrClient.name,
	main: attachHmrClient,
	crumb: attachHmrClientCrumb,
};
