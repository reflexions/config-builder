import { AsyncLocalStorage } from "node:async_hooks";
import {
	getHook,
	getHookFnResult,
} from "../../RunPlugins.mjs";
import optionsContext from "../context-providers/options/OptionsContext.mjs";
import {
	hasBrowserBuildSymbol,
	hasNodeBuildSymbol,
} from "../context-providers/compilation-report/CompilationReport.mjs";



export const targetPlatforms = {
	node: Symbol('node'),
	browser: Symbol('browser'),
};


export const buildNode = Symbol('buildNode');
export const getBuildNode = () => getHook(buildNode, true);
export const buildBrowser = Symbol('buildBrowser');
export const getBuildBrowser = () => getHook(buildBrowser, true);

export const buildNodeConfig = Symbol('buildNodeConfig');
export const buildBrowserConfig = Symbol('buildBrowserConfig');

export const targetPlatformContext = new AsyncLocalStorage();

export const getIsNode = () => targetPlatformContext.getStore() === targetPlatforms.node;
export const getIsBrowser = () => targetPlatformContext.getStore() === targetPlatforms.browser;

const separateNodeAndBrowserBuilds = async () => {
	const options = optionsContext.getStore();

	const browserConfig = getBuildBrowser()
		&& await targetPlatformContext.run(targetPlatforms.browser, async () =>
			await getHookFnResult(buildBrowserConfig, () => null),
		);
	options.set(hasBrowserBuildSymbol, Boolean(browserConfig));

	const nodeConfig = getBuildNode()
		&& await targetPlatformContext.run(targetPlatforms.node, async () =>
			await getHookFnResult(buildNodeConfig, () => null),
		);
	options.set(hasNodeBuildSymbol, Boolean(nodeConfig));

	return ([
		// the browser build outputs the assets.json that the server build needs
		// so we do that first. TODO: is this true?
		browserConfig,
		nodeConfig,
	].filter(x => x));
};

const separateNodeAndBrowserBuildsCrumb = Symbol(separateNodeAndBrowserBuilds.name);

const getPlugin = () => ({
	name: separateNodeAndBrowserBuilds.name,
	main: separateNodeAndBrowserBuilds,
	crumb: separateNodeAndBrowserBuildsCrumb,
})

export default getPlugin;
