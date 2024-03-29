import { getHookFnResult } from "../../RunPlugins.mjs";
import { getNodeTargetsHook } from "../webpack/NodeConfig.mjs";
import { getBrowserTargetsHook } from "../webpack/BrowserConfig.mjs";

const getTargets = async (isNode) => isNode
	? await getHookFnResult(getNodeTargetsHook)
	: await getHookFnResult(getBrowserTargetsHook);
export const getTargetsCrumb = Symbol(getTargets.name);
export const getTargetsHook = Symbol("getTargetsHook");

export default {
	name: getTargets.name,
	crumb: getTargetsCrumb,
	hooks: new Map([
		[ getTargetsHook, getTargets ],
	]),
};
