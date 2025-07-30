import runPlugins from "../../../RunPlugins.mjs";
import pathsContext from "./PathsContext.mjs";

const pathsContextPlugin = async (plugins) => {
	return pathsContext.run(new Map(), () => runPlugins(plugins));
};

const pathsContextCrumb = Symbol(pathsContextPlugin.name);

const getPlugin = (plugins) => ({
	name: pathsContextPlugin.name,
	main: () => pathsContextPlugin(plugins),
	crumb: pathsContextCrumb,
});

export default getPlugin;
