import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import CleanCSS from 'clean-css';
import {
	getIsProduction,
} from "../context-providers/options/Options.mjs";

import { getIsNode } from "./SeparateNodeAndBrowserBuilds.mjs";

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
				// new CssMinimizerPlugin({
				// 	minimizerOptions: {
				// 		sourceMap: true,
				// 	},
				// 	minify: async (data, inputMap, minimizerOptions) => {
				// 		const [[filename, input]] = Object.entries(data);
				// 		const minifiedCss = await new CleanCSS({ sourceMap: minimizerOptions.sourceMap }).minify({
				// 			[filename]: {
				// 				styles: input,
				// 				sourceMap: inputMap,
				// 			},
				// 		});
				//
				// 		return {
				// 			css: minifiedCss.styles,
				// 			map: minifiedCss.sourceMap ? minifiedCss.sourceMap.toJSON() : '',
				// 			warnings: minifiedCss.warnings,
				// 		};
				// 	},
				// })
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
