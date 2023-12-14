import pathsContext from "./PathsContext.mjs";

export const appDirBuilderSymbol = Symbol('appDirBuilderSymbol');
/** a function that takes a path relative to the app dir and returns the absolute path */
export const getAppDirBuilder = () => pathsContext.getStore().get(appDirBuilderSymbol);


export const dotEnvSymbol = Symbol('dotEnvSymbol');
/** gets .env path */
export const getDotEnv = () => pathsContext.getStore().get(dotEnvSymbol);

/** gets app root absolute filesystem path */
export const appDirSymbol = Symbol('appDirSymbol');
export const getAppDir = () => pathsContext.getStore().get(appDirSymbol);

/** gets app/build absolute filesystem path */
export const appBuildDirSymbol = Symbol('appBuildDirSymbol');
export const getAppDirBuild = () => pathsContext.getStore().get(appBuildDirSymbol);

/** gets app/public absolute filesystem path */
export const appSrcPublicDirSymbol = Symbol('appSrcPublicDirSymbol');
export const getAppSrcPublicDir = () => pathsContext.getStore().get(appSrcPublicDirSymbol);

/** gets app/build/public absolute filesystem path */
export const appBuildPublicDirSymbol = Symbol('appBuildPublicDirSymbol');
export const getAppBuildPublicDir = () => pathsContext.getStore().get(appBuildPublicDirSymbol);

/** gets app/build/assets.json absolute filesystem path */
export const appAssetsManifestSymbol = Symbol('appAssetsManifestSymbol');
export const getAppAssetsManifest = () => pathsContext.getStore().get(appAssetsManifestSymbol);


/** gets app/node_modules absolute filesystem path */
export const appNodeModulesSymbol = Symbol('appNodeModulesSymbol');
export const getAppNodeModules = () => pathsContext.getStore().get(appNodeModulesSymbol);

export const appSrcSymbol = Symbol('appSrcSymbol');
export const getAppSrc = () => pathsContext.getStore().get(appSrcSymbol);

export const appPackageJsonSymbol = Symbol('appPackageJsonSymbol');
export const getAppPackageJson = () => pathsContext.getStore().get(appPackageJsonSymbol);

export const tsTestsSetupSymbol = Symbol('tsTestsSetupSymbol');
export const getTsTestsSetup = () => pathsContext.getStore().get(tsTestsSetupSymbol);

export const jsTestsSetupSymbol = Symbol('jsTestsSetupSymbol');
export const getJsTestsSetup = () => pathsContext.getStore().get(jsTestsSetupSymbol);

export const appBabelRcSymbol = Symbol('appBabelRcSymbol');
export const getAppBabelRc = () => pathsContext.getStore().get(appBabelRcSymbol);

export const appJsConfigSymbol = Symbol('appJsConfigSymbol');
export const getAppJsConfig = () => pathsContext.getStore().get(appJsConfigSymbol);

export const appTsConfigSymbol = Symbol('appTsConfigSymbol');
export const getAppTsConfig = () => pathsContext.getStore().get(appTsConfigSymbol);

/** the path to the root of this config builder */
export const configBuilderDirSymbol = Symbol('configBuilderDirSymbol');
export const getConfigBuilderDir = () => pathsContext.getStore().get(configBuilderDirSymbol);
