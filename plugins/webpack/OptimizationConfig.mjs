import {
	getIsProduction,
} from "../context-providers/options/Options.mjs";

import { getIsNode } from "./SeparateNodeAndBrowserBuilds.mjs";

const optimizationConfig = async ({ config, isProduction, isNode }) => {
	return ({
		...config,

		optimization: {
			minimize: isProduction,
			providedExports: isProduction,
			removeAvailableModules: isProduction,
			removeEmptyChunks: isProduction,
			sideEffects: isProduction,
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
