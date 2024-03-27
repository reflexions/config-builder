import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import {
	getIsProduction,
} from "../context-providers/options/Options.mjs";

import { getIsNode } from "./SeparateNodeAndBrowserBuilds.mjs";
import {
	getHook,
	getHookFnResult,
} from "../../RunPlugins.mjs";

export const cssMinifierNameHook = Symbol("cssMinifierNameHook");
export const cssMinifierPluginInstanceHook = Symbol("cssMinifierPluginInstanceHook");

const terserPluginOptions = {
	// https://webpack.js.org/plugins/terser-webpack-plugin/#options
	terserOptions: {
		parse: {
			// we want uglify-js to parse ecma 8 code. However, we don't want it
			// to apply any minfication steps that turns valid ecma 5 code
			// into invalid ecma 5 code. This is why the 'compress' and 'output'
			// sections only apply transformations that are ecma 5 safe
			// https://github.com/facebook/create-react-app/pull/4234
			ecma: 8,
		},
		compress: {
			ecma: 2016,
			warnings: true,
			// Disabled because of an issue with Uglify breaking seemingly valid code:
			// https://github.com/facebook/create-react-app/issues/2376
			// Pending further investigation:
			// https://github.com/mishoo/UglifyJS2/issues/2011
			comparisons: false,
			// Disabled because of an issue with Terser breaking valid code:
			// https://github.com/facebook/create-react-app/issues/5250
			// Pending futher investigation:
			// https://github.com/terser-js/terser/issues/120
			inline: 2,
		},

		// for temporal graphql https://reflexions.slack.com/archives/C8KP2CGTZ/p1709652849992809?thread_ts=1709649000.502189&cid=C8KP2CGTZ
		// validate by looking at the /reflexions-test/full-schema?format=SDL schema and searching for "scalar ZonedDateTime"
		keep_classnames: /ZonedDateTime|Instant/,

		mangle: {
			safari10: false,
		},
		output: {
			ecma: 2016,
			comments: false,
			// Turned on because emoji and regex is not minified properly using default
			// https://github.com/facebook/create-react-app/issues/2488
			ascii_only: true,
		},
	},
}

const optimizationConfig = async ({ config, isProduction, isNode }) => {

	// options from https://webpack.js.org/plugins/css-minimizer-webpack-plugin/#minify
	// webpack's default is cssnanoMinify
	// cleancss leaves in duplicate root var declarations and is ~2x bigger than the others
	// esbuildMinify saves 3 sec but makes a slightly larger file than cssnano
	const cssMinifierName = getHook(cssMinifierNameHook, "cssnanoMinify");

	const cssMinifierPluginInstance = getHookFnResult(cssMinifierPluginInstanceHook, () => (
		// in addition to minifying, this merges all css into a single file
		new CssMinimizerPlugin({
			minimizerOptions: ['cssnanoMinify'].includes(cssMinifierName)
				? {
					sourceMap: true,
				}
				: undefined,

			// Default: CssMinimizerPlugin.cssnanoMinify
			//minify: CssMinimizerPlugin.cleanCssMinify,
			minify: CssMinimizerPlugin[ cssMinifierName ],

			// to do it all manually (if you want to see the output before minification)
			// minify: async (data, inputMap, minimizerOptions) => {
			// 	// this import doesn't work if done earlier
			//  // Webpack docs note: "Always use require inside minify function when parallel option enabled."
			// 	const CleanCss = (await import('clean-css')).default;
			//
			// 	const [[filename, input]] = Object.entries(data);
			//
			// 	const minifiedCss = await new CleanCss({
			// 		sourceMap: minimizerOptions.sourceMap,
			// 		returnPromise: true,
			// 	})
			// 		.minify({
			// 			[filename]: {
			// 				styles: input,
			// 				sourceMap: inputMap,
			// 			},
			// 		})
			// 		.catch((error) => {
			// 			console.error("CleanCss failed", error);
			// 			throw error;
			// 		});
			//
			// 	return {
			// 		css: minifiedCss.styles,
			// 		map: minifiedCss.sourceMap ? minifiedCss.sourceMap.toJSON() : '',
			// 		warnings: minifiedCss.warnings,
			// 	};
			// },
		})
	));
	return ({
		...config,

		optimization: {
			minimize: isProduction,
			providedExports: isProduction,
			removeAvailableModules: isProduction,
			removeEmptyChunks: isProduction,
			sideEffects: isProduction,

			minimizer: [
				new TerserPlugin(terserPluginOptions),

				cssMinifierPluginInstance,
			],
		},
	});
};

const optimizationConfigCrumb = Symbol("optimizationConfigCrumb");
const attachOptimizationConfig = async config => {
	const isProduction = getIsProduction();
	const isNode = getIsNode();
	return await optimizationConfig({ config, isProduction, isNode });
};

export default {
	name: attachOptimizationConfig.name,
	main: attachOptimizationConfig,
	crumb: optimizationConfigCrumb,
};
