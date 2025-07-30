import StartServerPlugin from "razzle-start-server-webpack-plugin";
import { getHook, getHookFnResult } from "../../../RunPlugins.mjs";
import {
	getIsProduction,
	getReactServerComponents,
	getServerNodeArgs,
} from "../../context-providers/options/Options.mjs";
import { getWebpack } from "../../context-providers/webpack/WebpackContext.mjs";

const attachHmrServerCrumb = Symbol("attachHmrServerCrumb");

// hooks
const startServerPluginHook = Symbol("startServerPluginHook");
const startServerPluginArgsHook = Symbol("startServerPluginArgsHook");
const startServerPluginNodeArgsHook = Symbol("startServerPluginNodeArgsHook");
const attachHmrServerWatchIgnoreSymbol = Symbol(
	"attachHmrServerWatchIgnoreSymbol",
);

const ourResolve = (path) => new URL(import.meta.resolve(path)).pathname;

const attachHmrServer = async (config) => {
	const isProduction = getIsProduction();
	const webpack = getWebpack();

	if (isProduction) {
		console.warn("attachHmrServer disabled when isProduction");
		return config;
	}

	return {
		...config,

		plugins: [
			...config?.plugins,
			new webpack.HotModuleReplacementPlugin(),
			await getHookFnResult(
				startServerPluginHook,
				async () =>
					new StartServerPlugin(
						await getHookFnResult(startServerPluginArgsHook, async () => ({
							name: "server.js",
							entryName: "server",
							killOnExit: false,
							killOnError: false,
							killTimeout: 1000,
							nodeArgs: getHook(startServerPluginNodeArgsHook, [
								...getServerNodeArgs(),
								"-r",
								ourResolve("source-map-support/register"),
								...(getReactServerComponents()
									? ["--conditions=react-server"]
									: []),
							]),
							restartable: !isProduction,
							verbose: true,
						})),
					),
			),
		].filter((x) => x),

		watch: !isProduction,
		watchOptions: {
			ignored: [
				...getHook(attachHmrServerWatchIgnoreSymbol, ["**/node_modules"]),
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
