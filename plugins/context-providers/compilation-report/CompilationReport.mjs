import compilationReportContext from "./CompilationReportContext.mjs";

/* Whether there was a config for a node build */
export const hasNodeBuildSymbol = Symbol("hasNodeBuildSymbol");
/* Whether there was a config for a browser build */
export const hasBrowserBuildSymbol = Symbol("hasBrowserBuildSymbol");

export const hasNodeBuild = () =>
	compilationReportContext.getStore().get(hasNodeBuildSymbol);
export const hasBrowserBuild = () =>
	compilationReportContext.getStore().get(hasBrowserBuildSymbol);
