//import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import stringToBoolean from "@reflexions/string-to-boolean";
import { WebpackAssetsManifest } from "webpack-assets-manifest"; // no longer uses default export as of v6
import ConfigBuilderPlugin from "../../ConfigBuilderPlugin.mjs";
import {
	getIsProduction,
	getShouldCalculateResourceIntegrity,
} from "../context-providers/options/Options.mjs";
import { getAppAssetsManifest } from "../context-providers/paths/Paths.mjs";
import { getIsNode } from "./SeparateNodeAndBrowserBuilds.mjs";

const assetsManifestConfig = async ({ config, isProduction, isNode }) => {
	return {
		...config,

		plugins: [
			...config.plugins,

			// Output all files in a manifest file called assets-manifest.json
			// in the build directory.

			// https://www.npmjs.com/package/webpack-assets-manifest#options-read-the-schema
			new WebpackAssetsManifest({
				output: getAppAssetsManifest(),
				writeToDisk: true,

				// https://www.npmjs.com/package/webpack-assets-manifest#publicpath
				// this will be the PORT+1 server for dev builds
				publicPath: true,

				entrypoints: true,

				// dev builds spend a few hundred ms calculating the hashes if this is on
				integrity: getShouldCalculateResourceIntegrity(),

				space: "\t",
			}),

			// new WebpackManifestPlugin({
			// 	fileName: getAppAssetsManifest(),
			// 	writeToFileEmit: true,
			//
			// 	// https://www.npmjs.com/package/webpack-assets-manifest#publicpath
			// 	// this will be the PORT+1 server for dev builds
			// 	//publicPath: true,
			//
			// 	// entryPoints: true
			// }),
		],
	};
};

const assetsManifestConfigCrumb = Symbol("assetsManifestConfigCrumb");
const assetsManifestPlugin = async (config) => {
	const isProduction = getIsProduction();
	const isNode = getIsNode();
	return await assetsManifestConfig({ config, isProduction, isNode });
};

class AssetsManifestConfig extends ConfigBuilderPlugin {}
export default new AssetsManifestConfig({
	name: assetsManifestPlugin.name,
	main: assetsManifestPlugin,
	crumb: assetsManifestConfigCrumb,
});
