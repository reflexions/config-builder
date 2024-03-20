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
import { getHookFnResult } from "../../RunPlugins.mjs";
import { silentMkdir } from "../../utils/silentMkdir.mjs";

/* https://webpack.js.org/configuration/target/#target */
export const getBrowserTargetHook = Symbol("getBrowserTargetHook");
/* https://babeljs.io/docs/options#targets */
export const getBrowserTargetsHook = Symbol("getBrowserTargetsHook");
export const getBrowserOutputFilenameHook = Symbol("getBrowserOutputFilenameHook");
export const getBrowserOutputChunkFilenameHook = Symbol("getBrowserOutputChunkFilenameHook");
export const getBrowserLibraryTargetHook = Symbol("getBrowserLibraryTargetHook");


const browserConfig = async ({ config, isProduction }) => {
	// make sure the dir that we're going to copy into (/var/www/html/build/public) exists
	await silentMkdir(getAppSrcPublicDir());

	return ({
		...config,

		target: await getHookFnResult(getBrowserTargetHook),
		entry: {
			client: [
				"/var/www/html/src/client.js",
			],
		},
		output: {
			...config.output,

			path: "/var/www/html/build/public",
			publicPath: isProduction
				? '/'
				: getHmrClientPublicUrl().href,
			filename: await getHookFnResult(getBrowserOutputFilenameHook, () => `static/js/[name].${isProduction
				? '[contenthash:8].'
				: ''}js`),
			chunkFilename: await getHookFnResult(getBrowserOutputChunkFilenameHook, () => `static/js/[name].${isProduction
				? '[contenthash:8].'
				: ''}chunk.js`),

			/* deprecated https://webpack.js.org/configuration/output/#outputlibrarytarget */
			libraryTarget: await getHookFnResult(getBrowserLibraryTargetHook, () => "var"),
			library: {
				type: await getHookFnResult(getBrowserLibraryTargetHook, () => "var"),
				name: "client",
			},

			environment: {
				// The environment supports arrow functions ('() => { ... }').
				arrowFunction: true,
				// The environment supports async function and await ('async function () { await ... }').
				asyncFunction: true,
				// The environment supports BigInt as literal (123n).
				bigIntLiteral: true,
				// The environment supports const and let for variable declarations.
				const: true,
				// The environment supports destructuring ('{ a, b } = obj').
				destructuring: true,
				// The environment supports an async import() function to import EcmaScript modules.
				dynamicImport: true,
				// The environment supports an async import() when creating a worker, only for web targets at the moment.
				dynamicImportInWorker: true,
				// The environment supports 'for of' iteration ('for (const x of array) { ... }').
				forOf: true,
				// The environment supports 'globalThis'.
				globalThis: true,
				// The environment supports ECMAScript Module syntax to import ECMAScript modules (import ... from '...').
				module: true,
				// The environment supports optional chaining ('obj?.a' or 'obj?.()').
				optionalChaining: true,
				// The environment supports template literals.
				templateLiteral: true,
			},
		},

		plugins: [
			...config.plugins ?? [],

			new CopyPlugin({
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
