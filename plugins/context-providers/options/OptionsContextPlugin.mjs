import runPlugins from "../../../RunPlugins.mjs";
import optionsContext from "./OptionsContext.mjs";

const optionsContextPlugin = async (plugins) => {
	return optionsContext.run(new Map(), () => runPlugins(plugins));
};

const optionsContextCrumb = Symbol(optionsContextPlugin.name);

const getPlugin = (plugins) => ({
	name: optionsContextPlugin.name,
	main: () => optionsContextPlugin(plugins),
	crumb: optionsContextCrumb,
});

export default getPlugin;
