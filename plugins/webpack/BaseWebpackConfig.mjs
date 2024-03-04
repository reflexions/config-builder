import {
	getHmrClientPublicUrl,
	getIsProduction,
	getPublicUrl,
} from "../context-providers/options/Options.mjs";
import {
	getIsNode,
} from "./SeparateNodeAndBrowserBuilds.mjs";
import {
	getHook,
	getHookFn,
} from "../../RunPlugins.mjs";

const profile = false; // https://webpack.js.org/configuration/other-options/#profile
const parallelism = undefined; // https://webpack.js.org/configuration/other-options/#parallelism

export const getModeHook = Symbol("getModeHook");
export const getContextHook = Symbol("getContextHook");
export const getDevToolHook = Symbol("getDevToolHook");
export const getCrossOriginLoadingHook = Symbol("getCrossOriginLoadingHook");

const baseConfig = async ({ isProduction, isNode }) => ({
	mode: await getHookFn(getModeHook, () => isProduction ? "production" : "development"),
	context: await getHookFn(getContextHook, () => "/var/www/html"),
	devtool: await getHookFn(getDevToolHook, () => isProduction ? "source-map" : "eval-cheap-module-source-map"),
	output: {
		pathinfo: !isProduction,
		hashFunction: 'xxhash64',
		crossOriginLoading: await getHookFn(getCrossOriginLoadingHook, () => isProduction ? undefined : "anonymous"),
	},
	profile,
	parallelism,
	cache: true,

	module: {
		strictExportPresence: true,
	},

	resolve: {
		alias: {
			"date-fns": "date-fns/esm"
		},
		extensions: [
			".mjs",
			".js",
			".jsx",
			".json",
			".ts",
			".tsx"
		],
		mainFields: isNode ? [
			"main",
			"module"
		] : [
			"browser",
			"module",
			"main"
		],
		modules: [
			"/var/www/html/src",
			"/var/www/html/src/styles",
			"node_modules"
		],
		plugins: [],
		unsafeCache: false,

		...(isNode
			? {}
			: {
				fallback: {
					crypto: "/var/www/html/node_modules/crypto-js/index.js",
					stream: "/var/www/html/node_modules/stream-browserify/index.js"
				},
			}
		)
	},
	resolveLoader: {
		modules: [
			"/var/www/html/node_modules"
		],
		plugins: []
	}
});

const attachBaseWebpackConfigCrumb = Symbol("attachBaseWebpackConfig");
const attachBaseWebpackConfig = async config => {
	const isProduction = getIsProduction();
	const isNode = getIsNode();

	return ({
		...config,
		...await baseConfig({ isProduction, isNode }),
	});
};

export default {
	name: attachBaseWebpackConfig.name,
	main: attachBaseWebpackConfig,
	crumb: attachBaseWebpackConfigCrumb,
};
