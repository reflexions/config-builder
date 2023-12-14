import {
	getIsProduction,
	getShouldUseReactRefresh,
} from "../context-providers/options/Options.mjs";
import {
	getIsBrowser,
} from "./SeparateNodeAndBrowserBuilds.mjs";
import stringToBoolean from "@reflexions/string-to-boolean";
import webpackContext from "../context-providers/webpack/WebpackContext.mjs";

const CUSTOMER = "customer_site";
const B2B = "b2b";
const DISCOUNT_PORTAL = "discount-portal";


const hardcodedProjectConfig = async ({ config, isProduction, isBrowser }) => {
	// could put this SITE stuff behind a isProduction, but HMR recompiles
	// everything it sees when one file changes so this helps limit the rebuild

	const SITE = JSON.stringify(process.env.SITE || CUSTOMER);
	const isB2B = JSON.stringify(process.env.SITE === B2B);
	const isB2bApi = JSON.stringify([ B2B, DISCOUNT_PORTAL ].includes(process.env.SITE));
	const isDiscount = JSON.stringify(process.env.SITE === DISCOUNT_PORTAL);
	const noDebug = JSON.stringify(process.env.DEBUG_STRIPPED === '1');
	const RESOURCE_INTEGRITY = JSON.stringify(stringToBoolean(process.env.RESOURCE_INTEGRITY ?? isProduction));
	const EMOTION_SSR = JSON.stringify(stringToBoolean(process.env.EMOTION_SSR ?? isProduction));

	const PASSES_ENABLED = JSON.stringify(process.env.PASSES_ENABLED);

	const allDefines = {
		// by hardcoding SITE during build, the optimizer can tree shake out other sites
		// could put this SITE stuff behind a isProduction, but HMR recompiles
		// everything it sees when one file changes so this helps limit the rebuild
		[ "process.env.SITE" ]: SITE, // in case we ever try to read the var directly
		[ "ProcessEnvVars.SITE" ]: SITE, // what PublicAppVars reads (PublicAppVars reads process.env not process.env.SITE)
		[ "EnvVars.SITE" ]: SITE, // not used (yet) but probably will be eventually
		[ "PublicAppVars.SITE" ]: SITE, // this is the one that is really used
		[ "PublicAppVars.isB2B" ]: isB2B,
		[ "PublicAppVars.isB2bApi" ]: isB2bApi,
		[ "PublicAppVars.isDiscount" ]: isDiscount,

		[ "process.env.PASSES_ENABLED" ]: PASSES_ENABLED, // in case we ever try to read the var directly
		[ "ProcessEnvVars.PASSES_ENABLED" ]: PASSES_ENABLED, // what PublicAppVars reads (PublicAppVars reads process.env not process.env.SITE)
		[ "EnvVars.PASSES_ENABLED" ]: PASSES_ENABLED, // used on the server-side
		[ "PublicAppVars.PASSES_ENABLED" ]: PASSES_ENABLED, // this is the one that is really used

		[ "__DEV__" ]: JSON.stringify(!isProduction), // apollo-client expects this https://github.com/apollographql/apollo-client/pull/8347

		[ "EnvVars.RESOURCE_INTEGRITY" ]: RESOURCE_INTEGRITY, // this is the one that is really used
		[ "process.env.RESOURCE_INTEGRITY" ]: RESOURCE_INTEGRITY, // in case we ever try to read the var directly

		[ "EnvVars.EMOTION_SSR" ]: EMOTION_SSR, // this is the one that is really used
		[ "process.env.EMOTION_SSR" ]: EMOTION_SSR, // in case we ever try to read the var directly

		// strips out debug code that would otherwise be controlled by env var
		[ "process.env.DEBUG_STRIPPED" ]: noDebug,
		[ "EnvVars.DEBUG_STRIPPED" ]: noDebug,

		[ "process.env.shouldUseReactRefresh" ]: JSON.stringify(getShouldUseReactRefresh()),
	};

	if (!isProduction) {
		// https://github.com/webpack-contrib/style-loader/issues/427#issuecomment-625777264
		// define __webpack_nonce__ for style-loader to use. We only use style-loader in dev build.
		allDefines.__webpack_nonce__ = 'window.__CSP_NONCE';
	}

	if (isBrowser) {
		// for react-error-overlay
		// https://github.com/facebook/create-react-app/issues/11773
		allDefines.process = { env: {} };
	}

	console.log("allDefines", allDefines);

	return ({
		...config,

		plugins: [
			// want the hardcoding to happen first
			new (webpackContext.getStore()).DefinePlugin(allDefines),

			...(config.plugins ?? []),
		],
	});
};

const attachHardcodedProjectConfigCrumb = Symbol("attachHardcodedProjectConfigCrumb");
const attachHardcodedProjectConfig = async config => {
	const isProduction = getIsProduction();
	const isBrowser = getIsBrowser();
	return await hardcodedProjectConfig({ config, isProduction, isBrowser });
};

export default {
	name: attachHardcodedProjectConfig.name,
	main: attachHardcodedProjectConfig,
	crumb: attachHardcodedProjectConfigCrumb,
};
