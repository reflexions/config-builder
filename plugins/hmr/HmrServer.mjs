import { getIsProduction } from "../context-providers/options/Options.mjs";
import { getIsNode } from "../webpack/SeparateNodeAndBrowserBuilds.mjs";
import webpackContext from "../context-providers/webpack/WebpackContext.mjs";

const attachHmrServerCrumb = Symbol("attachHmrServerCrumb");
const attachHmrServer = async config => {
	const isProduction = getIsProduction();

	if (isProduction) {
		console.warn("attachHmrServer disabled when isProduction");
		return config;
	}

	const isNode = getIsNode();
	return {
		...config,

		plugins: [
			...config?.plugins,
			new (webpackContext.getStore()).HotModuleReplacementPlugin(),
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
