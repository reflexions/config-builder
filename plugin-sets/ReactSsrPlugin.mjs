import compilationReportContextPlugin from "../plugins/context-providers/compilation-report/CompilationReportContextPlugin.mjs";
import { getIsProduction } from "../plugins/context-providers/options/Options.mjs";
import optionsContextPlugin from "../plugins/context-providers/options/OptionsContextPlugin.mjs";
import optionsFromEnvPlugin from "../plugins/context-providers/options/OptionsFromEnvPlugin.mjs";
import pathsContextPlugin from "../plugins/context-providers/paths/PathsContextPlugin.mjs";
import pathsFromEnvPlugin from "../plugins/context-providers/paths/PathsFromEnvPlugin.mjs";
import webpackContextPlugin from "../plugins/context-providers/webpack/WebpackContextPlugin.mjs";
import getTargets from "../plugins/hooks/GetTargets.mjs";
import assetsManifestConfig from "../plugins/webpack/AssetsManifestConfig.mjs";
import baseWebpackConfig from "../plugins/webpack/BaseWebpackConfig.mjs";
import browserConfig, {
	getBrowserTargetsHook,
} from "../plugins/webpack/BrowserConfig.mjs";
import cssConfig from "../plugins/webpack/file-types/CssConfig.mjs";
import imageLoaderConfig from "../plugins/webpack/file-types/ImageLoaderConfig.mjs";
import javascriptConfig from "../plugins/webpack/file-types/JavascriptConfig.mjs";
import staticFileConfig from "../plugins/webpack/file-types/StaticFileConfig.mjs";
import hardcodedConfig from "../plugins/webpack/HardcodedConfig.mjs";
import hardcodedProjectConfig from "../plugins/webpack/HardcodedProjectConfig.mjs";
import hmrClient from "../plugins/webpack/hmr/HmrClient.mjs";
import hmrServer from "../plugins/webpack/hmr/HmrServer.mjs";
import logConfigPlugin from "../plugins/webpack/LogConfigPlugin.mjs";
import nodeConfig, {
	getNodeTargetsHook,
} from "../plugins/webpack/NodeConfig.mjs";
import optimizationConfig from "../plugins/webpack/OptimizationConfig.mjs";
import separateNodeAndBrowserBuilds, {
	buildBrowserConfig,
	buildNodeConfig,
	getBuildBrowser,
	getBuildNode,
} from "../plugins/webpack/SeparateNodeAndBrowserBuilds.mjs";
import webpackCompile from "../plugins/webpack/WebpackCompile.mjs";
import runPlugins, { getHookFnResult } from "../RunPlugins.mjs";

export const pathsContextPluginsHook = Symbol("pathsContextPluginsHook");
export const optionsContextPluginsHook = Symbol("optionsContextPluginsHook");
export const compilationReportContextPluginsHook = Symbol(
	"compilationReportContextPluginsHook",
);
export const webpackContextPluginsHook = Symbol("webpackContextPluginsHook");
export const preCompilePluginsHook = Symbol("preCompilePluginsHook");
export const postCompilePluginsHook = Symbol("postCompilePluginsHook");

const sharedPlugins = [
	baseWebpackConfig,
	getTargets,
	hardcodedConfig,
	hardcodedProjectConfig,
	javascriptConfig,
	staticFileConfig,
	imageLoaderConfig,
	cssConfig,
	optimizationConfig,
];
const reactSsrPlugin = async () =>
	await runPlugins([
		pathsContextPlugin(
			await getHookFnResult(pathsContextPluginsHook, async () => [
				pathsFromEnvPlugin,
				optionsContextPlugin(
					await getHookFnResult(optionsContextPluginsHook, async () => [
						optionsFromEnvPlugin,
						compilationReportContextPlugin(
							await getHookFnResult(
								compilationReportContextPluginsHook,
								async () => [
									webpackContextPlugin(
										await getHookFnResult(
											webpackContextPluginsHook,
											async () => [
												separateNodeAndBrowserBuilds(),
												{
													name: "browser-and-node-builds",
													crumb: Symbol("browser-and-node-builds"),
													hooks: new Map([
														[
															buildBrowserConfig,
															async () =>
																getBuildBrowser()
																	? await runPlugins(
																			[
																				...sharedPlugins,
																				browserConfig,
																				assetsManifestConfig,
																				!getIsProduction() && hmrClient,
																			].filter((x) => x),
																		)
																	: [],
														],
														[
															buildNodeConfig,
															async () =>
																getBuildNode()
																	? await runPlugins(
																			[
																				...sharedPlugins,
																				nodeConfig,
																				!getIsProduction() && hmrServer,
																			].filter((x) => x),
																		)
																	: [],
														],
													]),
												},
												...(await getHookFnResult(
													preCompilePluginsHook,
													async () => [],
												)),
												webpackCompile,
												...(await getHookFnResult(
													postCompilePluginsHook,
													async () => [],
												)),
											],
										),
									),
								],
							),
						),
					]),
				),
			]),
		),
	]);
const reactSsrPluginCrumb = Symbol(reactSsrPlugin.name);
export default {
	name: reactSsrPlugin.name,
	crumb: reactSsrPluginCrumb,
	main: reactSsrPlugin,
};
