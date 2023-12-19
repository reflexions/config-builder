import { getIsProduction } from "../../context-providers/options/Options.mjs";
import webpackContext from "../../context-providers/webpack/WebpackContext.mjs";
import StartServerPlugin from "razzle-start-server-webpack-plugin";
import {
	getHook,
	getHookFn,
} from "../../../RunPlugins.mjs";

const attachHmrServerCrumb = Symbol("attachHmrServerCrumb");

// hooks
const startServerPluginHook = Symbol("startServerPluginHook");
const startServerPluginArgsHook = Symbol("startServerPluginArgsHook");
const startServerPluginNodeArgsHook = Symbol("startServerPluginNodeArgsHook");

const attachHmrServer = async config => {
	const isProduction = getIsProduction();
	const webpack = webpackContext.getStore();

	if (isProduction) {
		console.warn("attachHmrServer disabled when isProduction");
		return config;
	}

	return {
		...config,

		plugins: [
			...config?.plugins,
			new webpack.HotModuleReplacementPlugin(),
			getHookFn(startServerPluginHook, () => new StartServerPlugin(getHook(startServerPluginArgsHook, ({
				entryName: "server",
				inject: false,
				killOnError: false,
				killOnExit: false,
				killTimeout: 1000,
				name: "server.js",
				nodeArgs: getHook(startServerPluginNodeArgsHook, ([
					"--inspect=0.0.0.0:9229",
				])),
				once: false,
				restartable: true,
				scriptArgs: [],
				signal: false,
				verbose: true,
			})))),
		],

		watch: !isProduction,
		watchOptions: {
			ignored: [
				"**/node_modules",
				// server build does listen for changes to client's assets.json
			],
			aggregateTimeout: 500,
			poll: false,
		},
	};
};

export default {
	name: attachHmrServer.name,
	main: attachHmrServer,
	crumb: attachHmrServerCrumb,
};
