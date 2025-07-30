import { getIsProduction } from "../../context-providers/options/Options.mjs";
import { getIsNode } from "../SeparateNodeAndBrowserBuilds.mjs";

const useAssetModules = true;

const staticFileConfig = async ({ config, isProduction, isNode }) => {
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
					exclude: [
						// scripts
						/\.(js|jsx|mjs)$/,
						/\.cjs/,
						/\.(ts|tsx)$/,
						/\.(vue)$/,

						// styles
						/\.(less)$/,
						/\.(s?css|sass)$/,

						// static
						/\.html$/,
						/\.json$/,

						// images
						/\.bmp$/,
						/\.gif$/,
						/\.jpe?g$/,
						/\.png$/,
						/\.svg$/,
					],

					...(useAssetModules
						? {
								type: "asset/resource",
								generator: {
									filename: `asset/${isNode ? "node" : "client"}/[name].[contenthash:8][ext]`,
									emit: !isNode,
									//emit: true,
								},
							}
						: {
								use: [
									{
										ident: "static-file-loader",
										loader: "file-loader",
										options: {
											emitFile: !isNode,
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

const attachStaticFileConfigCrumb = Symbol("attachStaticFileConfigCrumb");
const attachStaticFileConfig = async (config) => {
	const isProduction = getIsProduction();
	const isNode = getIsNode();
	return await staticFileConfig({ config, isProduction, isNode });
};

export default {
	name: attachStaticFileConfig.name,
	main: attachStaticFileConfig,
	crumb: attachStaticFileConfigCrumb,
};
