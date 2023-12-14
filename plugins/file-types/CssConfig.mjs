import MiniCssExtractPlugin from "mini-css-extract-plugin";
import {
	getIsProduction,
} from "../context-providers/options/Options.mjs";
import { getIsNode } from "../webpack/SeparateNodeAndBrowserBuilds.mjs";
import postcssNesting from "postcss-nesting";
import postcssReporter from 'postcss-reporter';
import postcssCustomMedia from 'postcss-custom-media';
import autoprefixer from "autoprefixer";
import { getHookFn } from "../../RunPlugins.mjs";
import { getTargetsHook } from "../hooks/GetTargets.mjs";

const cssConfig = async ({ config, isProduction, isNode }) => {

	// we only do postcss on server build if using tailwind
	// (needed so server build can understand tailwind's @apply)
	// but we're not doing that here, so only need it on client build
	const usePostcss = !isNode;

	const old_browser_compat = true;

	return ({
		...config,

		...(!isNode && isProduction
				? {
					plugins: [
						...config.plugins ?? [],
						new MiniCssExtractPlugin({
							"chunkFilename": "static/css/[name].[contenthash:8].chunk.css",
							"filename": "static/css/[name].[contenthash:8].css",
						}),
					],
				}
				: {}
		),

		module: {
			...config.module,

			rules: [
				...config.module?.rules ?? [],

				{
					test: /\.css$/,
					use: [
						...(isNode
								? []
								: isProduction
									? [ {
										loader: MiniCssExtractPlugin.loader,
										options: {
											esModule: true,
										},
									} ]
									: [ {
										loader: "style-loader",
										options: {
											attributes: {
												"data-styles-loaded": "true",
											},
											esModule: true,
										},
									} ]
						),
						{
							ident: "css-loader",
							loader: "css-loader",
							options: {
								esModule: true,

								importLoaders: usePostcss
									? 1
									: 0,

								modules: {
									// https://webpack.js.org/loaders/css-loader/#modules

									auto: true,

									// https://webpack.js.org/loaders/css-loader/#exportlocalsconvention
									// defaults to asIs if namedExport = false, camelCaseOnly if true
									// The "modules.namedExport" option requires the "modules.exportLocalsConvention" option to be "camelCaseOnly" or "dashesOnly"
									exportLocalsConvention: "dashesOnly",


									// For pre-rendering with mini-css-extract-plugin you should use this option instead of
									// style-loader!css-loader in the pre-rendering bundle. It doesn't embed CSS but only
									// exports the identifier mappings.
									exportOnlyLocals: isNode,

									// don't need to include the 'src' prefix in css classnames
									localIdentContext: (process.env.FRONTEND_BUILD_ROOT || '/var/www/html') + "/src",
									localIdentName: "[path]__[name]___[local]",


									// it also means you have to do
									// import * as style from './Button.module.css';
									// instead of
									// import style from './Button.module.css';
									// it lets webpack do better tree shaking
									namedExport: true,
								},
								sourceMap: true,
							},
						},
						...(usePostcss
								? [ {
									ident: "postcss-loader",
									loader: "postcss-loader",
									options: {
										postcssOptions: {
											// don't bother looking for .postcss files that we don't have
											// https://github.com/webpack-contrib/postcss-loader#boolean
											config: false,

											ident: "postcss-loader",
											plugins: [
												postcssCustomMedia({
													// https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-custom-media#options
												}),

												postcssNesting(),

												(isProduction || old_browser_compat) && !isNode && autoprefixer({
													// https://github.com/postcss/autoprefixer#options
													overrideBrowserslist: await getHookFn(getTargetsHook, undefined, [ isNode ]),
												}),

												// Log PostCSS messages in the console
												postcssReporter({
													// https://github.com/postcss/postcss-reporter#options
													clearMessages: false,
													throwError: true,
												}),
											],
											sourceMap: true,
										},
									},
								} ]
								: []
						),
					],
				},
			],
		},
	});
};

const attachCssConfigCrumb = Symbol("attachCssConfigCrumb");
const attachCssConfig = async config => {
	const isProduction = getIsProduction();
	const isNode = getIsNode();
	return await cssConfig({ config, isProduction, isNode });
};

export default {
	name: attachCssConfig.name,
	main: attachCssConfig,
	crumb: attachCssConfigCrumb,
};
