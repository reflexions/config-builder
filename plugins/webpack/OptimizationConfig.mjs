import { access } from "node:fs/promises";
import { constants } from "node:fs";
import {
	getHmrClientPublicUrl,
	getIsProduction,
} from "../context-providers/options/Options.mjs";
import {
	getAppAssetsManifest,
	getAppDir,
	getAppDirBuild,
	getAppSrcPublicDir,
} from "../context-providers/paths/Paths.mjs";
import CopyPlugin from 'copy-webpack-plugin';
import { getHookFn } from "../../RunPlugins.mjs";
import WebpackAssetsManifest from 'webpack-assets-manifest';
import stringToBoolean from "@reflexions/string-to-boolean";
import ClientDevServerPlugin from "./webpack-plugins/ClientDevServer.mjs";
import {
	getBrowserTargetHook,
	getBrowserTargetsHook,
} from "./BrowserConfig.mjs";

const browserConfig = async ({ config, isProduction }) => {
	const hasPublicDir = await access(getAppSrcPublicDir(), constants.R_OK)
		.then(() => true)
		.catch(() => false);
	console.log("getAppSrcPublicDir()", getAppSrcPublicDir());
	console.log("hasPublicDir", hasPublicDir);
	return ({
		...config,

		/* https://webpack.js.org/configuration/target/#target */
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
			...config.plugins,

			// Output all files in a manifest file called assets-manifest.json
			// in the build directory.
			new WebpackAssetsManifest({
				output: getAppAssetsManifest(),
				writeToDisk: true,

				// https://www.npmjs.com/package/webpack-assets-manifest#publicpath
				// this will be the PORT+1 server for dev builds
				publicPath: true,

				// entryPoints: true

				// dev builds spend a few hundred ms calculating the hashes if this is on
				integrity: stringToBoolean(process.env.RESOURCE_INTEGRITY ?? isProduction),
			}),
			!isProduction && new ClientDevServerPlugin(),
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
				"last 1 Safari version",
			],
		],
	]),
};
