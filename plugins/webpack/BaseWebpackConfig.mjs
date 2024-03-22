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
	getHookFnResult,
} from "../../RunPlugins.mjs";

const profile = false; // https://webpack.js.org/configuration/other-options/#profile
const parallelism = undefined; // https://webpack.js.org/configuration/other-options/#parallelism

export const getModeHook = Symbol("getModeHook");
export const getContextHook = Symbol("getContextHook");
export const getDevToolHook = Symbol("getDevToolHook");
export const getCrossOriginLoadingHook = Symbol("getCrossOriginLoadingHook");

export const hashFunction = Symbol("hashFunction");
export const resolveAlias = Symbol("resolveAlias");
export const extensions = Symbol("extensions");
export const modules = Symbol("modules");
export const fallback = Symbol("fallback");
export const resolveSpread = Symbol("resolveSpread");
export const baseConfigSpread = Symbol("baseConfigSpread");

const baseConfig = async ({ isProduction, isNode }) => ({
	mode: await getHookFnResult(getModeHook, () => isProduction
		? "production"
		: "development"),
	context: await getHookFnResult(getContextHook, () => "/var/www/html"),
	devtool: await getHookFnResult(getDevToolHook, () => isProduction
		? "source-map"
		: "eval-cheap-module-source-map"),
	output: {
		pathinfo: !isProduction,
		hashFunction: getHook(hashFunction, 'xxhash64'),
		crossOriginLoading: await getHookFnResult(getCrossOriginLoadingHook, () => isProduction
			? undefined
			: "anonymous"),
	},
	profile,
	parallelism,
	cache: true,

	module: {
		strictExportPresence: true,
	},

	resolve: {
		alias: getHook(resolveAlias, {}),
		extensions: getHook(extensions, [
			".mjs",
			".js",
			".jsx",
			".json",
			".ts",
			".tsx",
		]),
		mainFields: isNode
			? [
				"main",
				"module",
			]
			: [
				"browser",
				"module",
				"main",
			],
		modules: getHook(modules, [
			"/var/www/html/src",
			"/var/www/html/src/styles",
			"node_modules",
		]),
		plugins: [],
		unsafeCache: false,

		fallback: getHook(fallback, isNode
			? {}
			: {
				crypto: "/var/www/html/node_modules/crypto-js/index.js",
				stream: "/var/www/html/node_modules/stream-browserify/index.js",
			}
		),

		...getHook(resolveSpread, {}),
	},
	resolveLoader: {
		modules: [
			"/var/www/html/node_modules",
		],
		plugins: [],
	},

	...getHook(baseConfigSpread, {}),
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
