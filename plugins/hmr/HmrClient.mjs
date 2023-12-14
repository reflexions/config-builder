import {
	getHmrClientPublicUrl,
	getHmrClientListenPort,
	getIsProduction,
	getListenHost,
} from "../context-providers/options/Options.mjs";
import {
	getIsNode,
} from "../webpack/SeparateNodeAndBrowserBuilds.mjs";
import {
	getAppAssetsManifest,
	getConfigBuilderDir,
} from "../context-providers/paths/Paths.mjs";

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
				getConfigBuilderDir() + '/plugins/hmr/webpackHotDevClientV4.mjs',
				...config.entry.client,
			],
		},

		// Per https://webpack.js.org/configuration/dev-server/
		// Be aware that when exporting multiple configurations only the devServer options for the first configuration will be taken into account and used for all the configurations in the array.
		devServer: {
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
				logging: "none",
				overlay: false,
			},
			devMiddleware: {
				publicPath: getHmrClientPublicUrl().href,
			},
			static: {
				watch: {
					ignored: /node_modules/,
				},
			},
		},

		watch: true,
		watchOptions: {
			ignored: [
				"**/node_modules",
				getAppAssetsManifest(),
			],
			aggregateTimeout: 500,
			poll: false,
		},
	};
};

export default {
	name: attachHmrClient.name,
	main: attachHmrClient,
	crumb: attachHmrClientCrumb,
};
