import {
	getHmrClientPublicUrl,
	getIsProduction,
} from "../context-providers/options/Options.mjs";
import {
	getAppAssetsManifest,
	getAppBuildPublicDir,
	getAppSrcPublicDir,
} from "../context-providers/paths/Paths.mjs";
import webpackContext from "../context-providers/webpack/WebpackContext.mjs";
import { getIsBrowser } from "./SeparateNodeAndBrowserBuilds.mjs";

const hardcodedConfig = async ({ config, isProduction, isBrowser }) => {
	const devDefines = {
		// we assume env vars can be hardcoded during dev build
		// the build happens on container start
		"EnvVars.HMR_PUBLIC_URL": JSON.stringify(getHmrClientPublicUrl().href),
		"process.env.HMR_PUBLIC_URL": JSON.stringify(getHmrClientPublicUrl().href),
		__DEV__: true,
	};
	const prodDefines = {
		// HMR_PUBLIC_URL is the same as PUBLIC_PATH for prod builds
		// but PUBLIC_PATH shouldn't be hardcoded, so don't hardcode HMR_PUBLIC_URL either
	};
	const sharedDefines = {
		"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
		"process.env.BUILD_TARGET": JSON.stringify(isBrowser ? "client" : "server"),
		"process.env.FAST_REFRESH": JSON.stringify(false),
		"process.env.ASSETS_MANIFEST_PATH": JSON.stringify(getAppAssetsManifest()),
		"process.env.PUBLIC_DIR": JSON.stringify(
			isProduction ? getAppBuildPublicDir() : getAppSrcPublicDir(),
		),
	};
	const allDefines = isProduction
		? {
				...sharedDefines,
				...prodDefines,
			}
		: {
				...sharedDefines,
				...devDefines,
			};

	return {
		...config,

		plugins: [
			// want the hardcoding to happen first
			new (webpackContext.getStore().DefinePlugin)(allDefines),

			...(config.plugins ?? []),
		],
	};
};

const attachHardcodingConfigCrumb = Symbol("attachHardcodingConfigCrumb");
const attachHardcodingConfig = async (config) => {
	const isProduction = getIsProduction();
	const isBrowser = getIsBrowser();
	return await hardcodedConfig({ config, isProduction, isBrowser });
};

export default {
	name: attachHardcodingConfig.name,
	main: attachHardcodingConfig,
	crumb: attachHardcodingConfigCrumb,
};
