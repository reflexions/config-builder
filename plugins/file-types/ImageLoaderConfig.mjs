import { getIsProduction } from "../context-providers/options/Options.mjs";
import { getIsNode } from "../webpack/SeparateNodeAndBrowserBuilds.mjs";

const imageLoaderConfig = async ({ config, isProduction, isNode }) => {
	return {
		...config,

		module: {
			...config.module,

			rules: [
				...config.module?.rules ?? [],

				{
					dependency: {
						not: [
							"url",
						],
					},
					test: [
						/\.bmp$/,
						/\.gif$/,
						/\.jpe?g$/,
						/\.png$/,
					],
					use: [
						{
							ident: "image-loader",
							loader: "url-loader",
							options: {
								emitFile: !isNode,
								limit: 10000,
								name: "static/media/[name].[contenthash:8].[ext]",
							},
						},
					],
				},
			],
		},
	};
};

const attachImageLoaderConfigCrumb = Symbol("attachImageLoaderConfigCrumb");
const attachImageLoaderConfig = async config => {
	const isProduction = getIsProduction();
	const isNode = getIsNode();
	return await imageLoaderConfig({ config, isProduction, isNode });
};

export default {
	name: attachImageLoaderConfig.name,
	main: attachImageLoaderConfig,
	crumb: attachImageLoaderConfigCrumb,
};
