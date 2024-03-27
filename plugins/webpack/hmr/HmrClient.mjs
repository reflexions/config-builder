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
import { getHook } from "../../../RunPlugins.mjs";
import BrowserDevServerPlugin from "../webpack-plugins/BrowserDevServer.mjs";

export const browserDevServerConfigSymbol = Symbol("browserDevServerConfigSymbol");
export const browserDevServerConfig = () => getHook(browserDevServerConfigSymbol, ({
	compress: true,
	headers: {
		"Access-Control-Allow-Origin": "*",
		"Cross-Origin-Resource-Policy": "same-site",
	},
	historyApiFallback: {
		disableDotRule: true,
	},
	hot: true,
	host: getListenHost(),
	port: getHmrClientListenPort(),
	allowedHosts: "all",
	client: {
		logging: 'verbose',
		overlay: false, // on hot reload, shows until both client + dev builds are complete
		progress: true,
	},
	devMiddleware: {
		publicPath: getHmrClientPublicUrl().href,
	},
	static: {
		watch: {
			ignored: /node_modules/,
		},
	},
}));

const attachHmrClientCrumb = Symbol("attachHmrClientCrumb");
const attachHmrClient = async config => {
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
				"**/node_modules",
				getAppAssetsManifest(),
			],
			//aggregateTimeout: 500,
			//poll: false,
		},
	};
};

export default {
	name: attachHmrClient.name,
	main: attachHmrClient,
	crumb: attachHmrClientCrumb,
};
