import { getHookFnResult } from "../../RunPlugins.mjs";
import { getIsProduction } from "../context-providers/options/Options.mjs";
import { getBrowserTargetsHook } from "../webpack/BrowserConfig.mjs";
import {
	defaultBrowserslistNodeTarget,
	getNodeTargetsHook,
} from "../webpack/NodeConfig.mjs";

const getTargets = async (isNode) =>
	isNode
		? await getHookFnResult(
				getNodeTargetsHook,
				() => defaultBrowserslistNodeTarget,
			)
		: await getHookFnResult(getBrowserTargetsHook, () =>
				getIsProduction()
					? [
							">1%",
							"not dead",
							"Firefox ESR",
							//"ie 11",
						]
					: [
							"last 2 Chrome versions",
							"last 2 Firefox versions",
							"last 1 Safari version",
						],
			);
export const getTargetsCrumb = Symbol(getTargets.name);
export const getTargetsHook = Symbol("getTargetsHook");

export default {
	name: getTargets.name,
	crumb: getTargetsCrumb,
	hooks: new Map([[getTargetsHook, getTargets]]),
};
