import {
	getIsProduction,
} from "../context-providers/options/Options.mjs";

import { getIsNode } from "./SeparateNodeAndBrowserBuilds.mjs";

const optimizationConfig = async ({ config, isProduction, isNode }) => {
	return ({
		...config,

		optimization: {
			minimize: false,
			providedExports: false,
			removeAvailableModules: false,
			removeEmptyChunks: false,
			sideEffects: false,
			splitChunks: false
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
