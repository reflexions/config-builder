import { access } from "node:fs/promises";
import { constants } from "node:fs";
import {
	getHmrClientPublicUrl,
	getIsProduction,
} from "../context-providers/options/Options.mjs";
import {
	getAppDir,
	getAppDirBuild,
	getAppSrcPublicDir,
} from "../context-providers/paths/Paths.mjs";
import CopyPlugin from 'copy-webpack-plugin';
import { getHookFn } from "../../RunPlugins.mjs";

/* https://webpack.js.org/configuration/target/#target */
export const getBrowserTargetHook = Symbol("getBrowserTargetHook");
/* https://babeljs.io/docs/options#targets */
export const getBrowserTargetsHook = Symbol("getBrowserTargetsHook");
export const getBrowserOutputFilenameHook = Symbol("getBrowserOutputFilenameHook");
export const getBrowserOutputChunkFilenameHook = Symbol("getBrowserOutputChunkFilenameHook");
export const getBrowserLibraryTargetHook = Symbol("getBrowserLibraryTargetHook");


const browserConfig = async ({ config, isProduction }) => {
	const hasPublicDir = await access(getAppSrcPublicDir(), constants.R_OK)
		.then(() => true)
		.catch(() => false);

	return ({
		...config,

		target: await getHookFn(getBrowserTargetHook),
		entry: {
			client: [
				"/var/www/html/src/client",
			],
		},
		output: {
			...config.output,

			path: "/var/www/html/build/public",
			publicPath: isProduction
				? '/'
				: getHmrClientPublicUrl().href,
			filename: await getHookFn(getBrowserOutputFilenameHook, () => `static/js/[name].${isProduction
				? '[contenthash:8].'
				: ''}js`),
			chunkFilename: await getHookFn(getBrowserOutputChunkFilenameHook, () => `static/js/[name].${isProduction
				? '[contenthash:8].'
				: ''}chunk.js`),

			/* deprecated https://webpack.js.org/configuration/output/#outputlibrarytarget */
			libraryTarget: await getHookFn(getBrowserLibraryTargetHook, () => "var"),
			library: {
				type: await getHookFn(getBrowserLibraryTargetHook, () => "var"),
				name: "client",
			},

			environment: {
				arrowFunction: true,
				bigIntLiteral: true,
				"const": true,
				destructuring: true,
				dynamicImport: true,
				forOf: true,
				"module": true,
				optionalChaining: true,
				templateLiteral: true,
			},
		},

		plugins: [
			...config.plugins ?? [],

			hasPublicDir && new CopyPlugin({
				patterns: [
					{
						from: getAppSrcPublicDir().replace(/\\/g, '/') + '/**/*',
						to: getAppDirBuild(),
						context: getAppDir(),
						globOptions: {
							ignore: [ getAppSrcPublicDir().replace(/\\/g, '/') + "/index.html" ],
						},
					},
				],
			}),
		].filter(x => x),
	});
};

const attachBrowserConfigCrumb = Symbol("attachBrowserConfigCrumb");
const attachBrowserConfig = async config => {
	const isProduction = getIsProduction();
	return await browserConfig({ config, isProduction });
};

export default {
	name: attachBrowserConfig.name,
	main: attachBrowserConfig,
	crumb: attachBrowserConfigCrumb,
	hooks: new Map([
		[ getBrowserTargetHook, () => "web" ],
		[ getBrowserTargetsHook, () => getIsProduction()
			? [
				">1%",
				"not dead",
				"Firefox ESR",
				//"ie 11",
			]
			: [
				"last 2 Chrome versions",
				"last 2 Firefox versions",
				"last 1 Safari version"
			]
		],
	]),
};
