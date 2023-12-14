import baseWebpackConfig from '../plugins/webpack/BaseWebpackConfig.mjs';
import runPlugins from "../RunPlugins.mjs";
import separateNodeAndBrowserBuilds, {
	buildBrowserConfig,
	buildNodeConfig,
} from "../plugins/webpack/SeparateNodeAndBrowserBuilds.mjs";
import optionsFromEnvPlugin from "../plugins/context-providers/options/OptionsFromEnvPlugin.mjs";
import pathsFromEnvPlugin from "../plugins/context-providers/paths/PathsFromEnvPlugin.mjs";
import webpackContextPlugin from "../plugins/context-providers/webpack/WebpackContextPlugin.mjs";
import {
	getIsProduction,
} from "../plugins/context-providers/options/Options.mjs";
import hmrClient from "../plugins/hmr/HmrClient.mjs";
import hmrServer from "../plugins/hmr/HmrServer.mjs";
import nodeConfig, { getNodeTargetsHook } from "../plugins/webpack/NodeConfig.mjs";
import browserConfig, { getBrowserTargetsHook } from "../plugins/webpack/BrowserConfig.mjs";
import hardcodedConfig from "../plugins/webpack/HardcodedConfig.mjs";
import hardcodedProjectConfig from "../plugins/webpack/HardcodedProjectConfig.mjs";
import javascriptConfig from "../plugins/file-types/JavascriptConfig.mjs";
import staticFileConfig from "../plugins/file-types/StaticFileConfig.mjs";
import imageLoaderConfig from "../plugins/file-types/ImageLoaderConfig.mjs";
import cssConfig from "../plugins/file-types/CssConfig.mjs";
import getTargets from "../plugins/hooks/GetTargets.mjs";
import pathsContextPlugin from "../plugins/context-providers/paths/PathsContextPlugin.mjs";
import optionsContextPlugin from "../plugins/context-providers/options/OptionsContextPlugin.mjs";
import compilationReportContextPlugin from "plugins/context-providers/compilation-report/CompilationReportContextPlugin.mjs"
import logConfigPlugin from "../plugins/webpack/LogConfigPlugin.mjs";
import webpackCompile from "../plugins/webpack/WebpackCompile.mjs";

const sharedPlugins = [
	baseWebpackConfig,
	getTargets,
	hardcodedConfig,
	hardcodedProjectConfig,
	javascriptConfig,
	staticFileConfig,
	imageLoaderConfig,
	cssConfig,
	{
		name: "local-shared-overrides",
		crumb: Symbol("local-overrides"),
		hooks: new Map([
			[ getBrowserTargetsHook, [
				"last 2 Chrome versions",
				"last 2 Firefox versions",
				"last 1 Safari version"
			] ],
		]),
	},
];
const getPlugins = async () => ([
	pathsContextPlugin([
		pathsFromEnvPlugin,
		optionsContextPlugin([
			optionsFromEnvPlugin,
			compilationReportContextPlugin([
				webpackContextPlugin([
					separateNodeAndBrowserBuilds(),
					{
						name: "local-overrides",
						crumb: Symbol("local-overrides"),
						hooks: new Map([
							[ buildBrowserConfig, async () => await runPlugins([
								...sharedPlugins,
								browserConfig,
								getIsProduction() ? null : hmrClient,
							].filter(x => x)) ],
							[ buildNodeConfig, async () => await runPlugins([
								...sharedPlugins,
								nodeConfig,
								hmrServer,
								getIsProduction() ? null : hmrServer,
							].filter(x => x)) ],
						]),
					},
					logConfigPlugin,
					webpackCompile,
				]),
			]),
		]),
	])
]);
export default getPlugins;
