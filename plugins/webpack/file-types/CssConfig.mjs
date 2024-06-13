import MiniCssExtractPlugin from "mini-css-extract-plugin";
import {
	getIsProduction,
} from "../../context-providers/options/Options.mjs";
import { getIsNode } from "../SeparateNodeAndBrowserBuilds.mjs";
import postcssNesting from "postcss-nesting";
import postcssReporter from 'postcss-reporter';
import postcssCustomMedia from 'postcss-custom-media';
import autoprefixer from "autoprefixer";
import postcssExtend from 'postcss-extend';
import tailwind from 'tailwindcss';
import tailwindNesting from 'tailwindcss/nesting/index.js';
import {
	getHook,
	getHookFnResult,
} from "../../../RunPlugins.mjs";
import { getTargetsHook } from "../../hooks/GetTargets.mjs";
import postcssGlobalData from "@csstools/postcss-global-data";
import {
	getAppSrc,
} from "../../context-providers/paths/Paths.mjs";

export const postcssGlobalDataFilesHook = Symbol("postcssGlobalDataFilesHook");
export const postcssExtendEnabledHook = Symbol("postcssExtendEnabledHook");
export const postcssExtendHook = Symbol("postcssExtendHook");
export const postcssCustomMediaEnabledHook = Symbol("postcssCustomMediaEnabledHook");
export const postcssCustomMediaHook = Symbol("postcssCustomMediaHook");
export const tailwindEnabledHook = Symbol("tailwindEnabledHook");
export const tailwindNestingEnabledHook = Symbol("tailwindNestingEnabledHook");
export const tailwindHook = Symbol("tailwindHook");
export const tailwindNestingHook = Symbol("tailwindNestingHook");
export const postcssNestingEnabledHook = Symbol("postcssNestingEnabledHook");
export const postcssNestingHook = Symbol("postcssNestingHook");


const cssConfig = async ({ config, isProduction, isNode }) => {

	const srcDir = getAppSrc();
	const tailwindEnabled = getHook(tailwindEnabledHook, false);

	// we only do postcss on server build if using tailwind
	// (needed so server build can understand tailwind's @apply)
	// always do it on the client build
	const usePostcss = !isNode || tailwindEnabled;

	const old_browser_compat = isProduction;

	return ({
		...config,

		plugins: [
			...config.plugins ?? [],

			!isNode && isProduction && new MiniCssExtractPlugin({
				"chunkFilename": "static/css/[name].[contenthash:8].chunk.css",
				"filename": "static/css/[name].[contenthash:8].css",
			}),
		].filter(x => x),

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
									localIdentContext: srcDir,
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

											ident: "postcss",
											plugins: [
												// https://www.npmjs.com/package/postcss-custom-media#modular-css-processing
												// Make sure this is ALWAYS defined before postcssCustomMedia
												postcssGlobalData({
													files: getHook(postcssGlobalDataFilesHook, [
														srcDir + '/styles/breakpoints.css',
														srcDir + '/styles/colors.css',
														srcDir + '/styles/sizings.css',
														srcDir + '/styles/typography-vars.css',
													]),
												}),

												...(
													getHook(postcssExtendEnabledHook, false)
														? await getHookFnResult(postcssExtendHook, () => [
															postcssExtend()
														])
														: []
												),

												...(
													getHook(postcssCustomMediaEnabledHook, true)
														? await getHookFnResult(postcssCustomMediaHook, () => [
															postcssCustomMedia({
																// https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-custom-media#options
															})
														])
														: []
												),

												...(
													tailwindEnabled
														? await getHookFnResult(tailwindHook, async () => [
															...(
																getHook(tailwindNestingEnabledHook, true)
																	? getHookFnResult(tailwindNestingHook, () => [
																		tailwindNesting(), // uses postcss-nested
																	])
																	: []
															),

															// Generates utility classes based on tailwind.config.js
															// this path must be valid on fe and cms (for the gutenberg build)
															tailwind((await import((process.env.FRONTEND_BUILD_ROOT || '/var/www/html') + '/tailwind.config.mjs')).default),
														])
														: []
												),

												...(
													getHook(postcssNestingEnabledHook, true)
														? await getHookFnResult(postcssNestingHook, () => [
															postcssNesting(),
														])
														: []
												),

												(isProduction || old_browser_compat) && !isNode && autoprefixer({
													// https://github.com/postcss/autoprefixer#options
													overrideBrowserslist: await getHookFnResult(getTargetsHook, undefined, [ isNode ]),
												}),

												// Log PostCSS messages in the console
												postcssReporter({
													// https://github.com/postcss/postcss-reporter#options
													clearMessages: false,
													throwError: true,
												}),
											].filter(x => x),
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
