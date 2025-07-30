import { getIsProduction } from "../../context-providers/options/Options.mjs";
import { getIsNode } from "../SeparateNodeAndBrowserBuilds.mjs";

const useAssetModules = true;

// Inlines small images (see limit)
const imageLoaderConfig = async ({ config, isProduction, isNode }) => {
	return {
		...config,

		module: {
			...config.module,

			rules: [
				...(config.module?.rules ?? []),

				{
					dependency: {
						not: ["url"],
					},
					test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
					...(useAssetModules
						? {
								type: "asset/resource",
							}
						: {
								use: [
									{
										ident: "image-loader",
										loader: "url-loader",
										options: {
											//emitFile: !isNode,
											emitFile: true,
											limit: 10000,
											name: "static/media/[name].[contenthash:8].[ext]",
										},
									},
								],

								// stop Asset Modules from processing your assets again as that would result in asset duplication
								type: "javascript/auto",
							}),
				},
			],
		},
	};
};

const attachImageLoaderConfigCrumb = Symbol("attachImageLoaderConfigCrumb");
const attachImageLoaderConfig = async (config) => {
	const isProduction = getIsProduction();
	const isNode = getIsNode();
	return await imageLoaderConfig({ config, isProduction, isNode });
};

export default {
	name: attachImageLoaderConfig.name,
	main: attachImageLoaderConfig,
	crumb: attachImageLoaderConfigCrumb,
};
