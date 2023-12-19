import {
	getIsProduction,
} from "../context-providers/options/Options.mjs";
import {
	getAppAssetsManifest,
} from "../context-providers/paths/Paths.mjs";
//import WebpackAssetsManifest from 'webpack-assets-manifest';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import stringToBoolean from "@reflexions/string-to-boolean";
import { getIsNode } from "./SeparateNodeAndBrowserBuilds.mjs";
import ConfigBuilderPlugin from "../../ConfigBuilderPlugin.mjs";

const assetsManifestConfig = async ({ config, isProduction, isNode }) => {
	return ({
		...config,

		plugins: [
			...config.plugins,

			// Output all files in a manifest file called assets-manifest.json
			// in the build directory.

			// new WebpackAssetsManifest({
			// 	output: getAppAssetsManifest(),
			// 	writeToDisk: true,
			//
			// 	// https://www.npmjs.com/package/webpack-assets-manifest#publicpath
			// 	// this will be the PORT+1 server for dev builds
			// 	publicPath: true,
			//
			// 	// entryPoints: true
			//
			// 	// dev builds spend a few hundred ms calculating the hashes if this is on
			// 	integrity: stringToBoolean(process.env.RESOURCE_INTEGRITY ?? isProduction),
			// }),

			new WebpackManifestPlugin({
				fileName: getAppAssetsManifest(),
				writeToFileEmit: true,

				// https://www.npmjs.com/package/webpack-assets-manifest#publicpath
				// this will be the PORT+1 server for dev builds
				//publicPath: true,

				// entryPoints: true
			}),
		],
	});
};

const assetsManifestConfigCrumb = Symbol("assetsManifestConfigCrumb");
const assetsManifestPlugin = async config => {
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
