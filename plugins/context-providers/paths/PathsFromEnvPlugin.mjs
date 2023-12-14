import { fileURLToPath } from 'node:url';

import path, { dirname } from "node:path";
import {
	appAssetsManifestSymbol,
	appBabelRcSymbol,
	appBuildDirSymbol,
	appBuildPublicDirSymbol,
	appDirSymbol,
	appNodeModulesSymbol,
	appPackageJsonSymbol,
	appSrcPublicDirSymbol,
	appSrcSymbol,
	configBuilderDirSymbol,
	dotEnvSymbol,
} from "./Paths.mjs";
import pathsContext from "./PathsContext.mjs";
import { getHook } from "../../../RunPlugins.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const appDirBuilderSyncHook = Symbol("appDirBuilderHook");

const pathsFromEnvPlugin = async (passthrough) => {
	const paths = pathsContext.getStore();

	const appDirBuilder = getHook(appDirBuilderSyncHook);

	paths.set(dotEnvSymbol, appDirBuilder('.env'));
	paths.set(appDirSymbol, appDirBuilder('.'));
	paths.set(appBuildDirSymbol, appDirBuilder('build'));
	paths.set(appBuildPublicDirSymbol, appDirBuilder('build/public'));
	paths.set(appAssetsManifestSymbol, appDirBuilder('build/assets.json'));
	paths.set(appSrcPublicDirSymbol, process.env.PUBLIC_DIR ?? appDirBuilder('public'));
	paths.set(appNodeModulesSymbol, appDirBuilder('node_modules'));
	paths.set(appSrcSymbol, appDirBuilder('src'));
	paths.set(appPackageJsonSymbol, appDirBuilder('package.json'));
	paths.set(appBabelRcSymbol, appDirBuilder('babel.config.json'));

	paths.set(configBuilderDirSymbol, path.resolve(__dirname, '../../..'));

	console.log("paths", paths);

	return passthrough;
};

const pathsFromEnvCrumb = Symbol(pathsFromEnvPlugin.name);

export default {
	name: pathsFromEnvPlugin.name,
	main: (passthrough) => pathsFromEnvPlugin(passthrough),
	crumb: pathsFromEnvCrumb,
	hooks: new Map([
		[ appDirBuilderSyncHook, (relativePath) => path.resolve('/var/www/html', relativePath) ],
	]),
};
