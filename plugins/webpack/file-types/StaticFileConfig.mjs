import { getIsProduction } from "../../context-providers/options/Options.mjs";
import { getIsNode } from "../SeparateNodeAndBrowserBuilds.mjs";

const staticFileConfig = async ({ config, isProduction, isNode }) => {
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
					exclude: [
						/\.html$/,
						/\.(js|jsx|mjs)$/,
						/\.(ts|tsx)$/,
						/\.(vue)$/,
						/\.(less)$/,
						/\.(re)$/,
						/\.(s?css|sass)$/,
						/\.json$/,
						/\.bmp$/,
						/\.gif$/,
						/\.jpe?g$/,
						/\.png$/,
						/\.cjs/,
					],
					// use: [
					// 	{
					// 		ident: "static-file-loader",
					// 		loader: "file-loader",
					// 		options: {
					// 			emitFile: !isNode,
					// 			name: "static/media/[name].[contenthash:8].[ext]",
					// 		},
					// 	},
					// ],

					type: 'asset/resource',
					generator: {
						filename: "static/media/[name].[contenthash:8][ext]",
						emit: !isNode,
					},
				},
			],
		},
	};
};

const attachStaticFileConfigCrumb = Symbol("attachStaticFileConfigCrumb");
const attachStaticFileConfig = async config => {
	const isProduction = getIsProduction();
	const isNode = getIsNode();
	return await staticFileConfig({ config, isProduction, isNode });
};

export default {
	name: attachStaticFileConfig.name,
	main: attachStaticFileConfig,
	crumb: attachStaticFileConfigCrumb,
};
