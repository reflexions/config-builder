import runPlugins from "../../../RunPlugins.mjs";
import webpack from "webpack";
import webpackContext from './WebpackContext.mjs';

const webpackContextPlugin = (plugins) => {
	return webpackContext.run(webpack, () => runPlugins(plugins));
};

const pathsContextCrumb = Symbol(webpackContextPlugin.name);

const getPlugin = (plugins) => ({
	name: webpackContextPlugin.name,
	main: () => webpackContextPlugin(plugins),
	crumb: pathsContextCrumb,
})

export default getPlugin;
