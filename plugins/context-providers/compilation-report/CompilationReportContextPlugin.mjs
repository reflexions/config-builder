import runPlugins from "../../../RunPlugins.mjs";
import compilationReportContext from "./CompilationReportContext.mjs";

const CompilationReportContextPlugin = async (plugins) => {
	return compilationReportContext.run(new Map(), () => runPlugins(plugins));
};

const compilationReportContextCrumb = Symbol(CompilationReportContextPlugin.name);

const getPlugin = (plugins) => ({
	name: CompilationReportContextPlugin.name,
	main: () => CompilationReportContextPlugin(plugins),
	crumb: compilationReportContextCrumb,
})

export default getPlugin;
