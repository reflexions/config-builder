import {
	getIsProduction,
	getShouldUseReactRefresh,
} from "../context-providers/options/Options.mjs";
import {
	getIsBrowser,
} from "./SeparateNodeAndBrowserBuilds.mjs";
import stringToBoolean from "@reflexions/string-to-boolean";
import webpackContext from "../context-providers/webpack/WebpackContext.mjs";
import {
	getHook,
	getHookFn,
} from "../../RunPlugins.mjs";

// these vars should match utils/constants/Sites.mjs
const CUSTOMER_SITE = "customer-site";
const B2B = "b2b";
const DISCOUNT_PORTAL = "discount-portal";
const GROUP_ADMIN = "group-admin";

export const publicVarDefine = (name, value) => ({
	[ `process.env.${name}` ]: value,
	[ `PublicAppVars.${name}` ]: value,
	[ `ProcessEnvVars.${name}` ]: value, // PublicAppVars reads this
});

export const privateVarDefine = (name, value) => ({
	[ `process.env.${name}` ]: value,
	[ `EnvVars.${name}` ]: value,
});

export const modifyDefinesHook = Symbol("modifyDefinesHook");
export const phasesHook = Symbol("phasesHook");

const hardcodedProjectConfig = async ({ config, isProduction, isBrowser }) => {
	const SITE = JSON.stringify(process.env.SITE);
	const isB2b = JSON.stringify(process.env.SITE === B2B);
	const isB2bApi = JSON.stringify([ B2B, DISCOUNT_PORTAL ].includes(process.env.SITE));
	const isDiscount = JSON.stringify(process.env.SITE === DISCOUNT_PORTAL);
	const isGroupAdmin = JSON.stringify(process.env.SITE === GROUP_ADMIN);

	const PHASES = getHook(phasesHook, {});
	const selectedPhase = PHASES[ process.env.PHASE.toLowerCase() ];
	const PHASE = typeof selectedPhase === "string"
		? JSON.stringify(selectedPhase) // adds the quotes
		: selectedPhase; // can leave numbers & undefined as-is

	const noDebug = JSON.stringify(process.env.DEBUG_STRIPPED === '1');
	const RESOURCE_INTEGRITY = JSON.stringify(stringToBoolean(process.env.RESOURCE_INTEGRITY ?? isProduction));
	const EMOTION_SSR = JSON.stringify(stringToBoolean(process.env.EMOTION_SSR ?? isProduction));

	const defaultsDefines = {
		// by hardcoding SITE during build, the optimizer can tree shake out other sites
		// could put this SITE stuff behind a isProduction, but HMR recompiles
		// everything it sees when one file changes so this helps limit the rebuild
		...publicVarDefine("SITE", SITE),
		...publicVarDefine("PHASE", PHASE),
		...publicVarDefine("isB2b", isB2b),
		...publicVarDefine("isB2B", isB2b), // deprecated. Prefer isB2b instead
		...publicVarDefine("isB2bApi", isB2bApi),
		...publicVarDefine("isDiscount", isDiscount),
		...publicVarDefine("isGroupAdmin", isGroupAdmin),

		// strips out debug code that would otherwise be controlled by env var
		...publicVarDefine("DEBUG_STRIPPED", noDebug),

		[ "__DEV__" ]: JSON.stringify(!isProduction), // apollo-client expects this https://github.com/apollographql/apollo-client/pull/8347

		...privateVarDefine("RESOURCE_INTEGRITY", RESOURCE_INTEGRITY),
		...privateVarDefine("EMOTION_SSR", EMOTION_SSR),

		[ "process.env.shouldUseReactRefresh" ]: JSON.stringify(getShouldUseReactRefresh()),
	};

	if (!isProduction) {
		// https://github.com/webpack-contrib/style-loader/issues/427#issuecomment-625777264
		// define __webpack_nonce__ for style-loader to use. We only use style-loader in dev build.
		defaultsDefines.__webpack_nonce__ = 'window.__CSP_NONCE';
	}

	if (isBrowser) {
		// for react-error-overlay
		// https://github.com/facebook/create-react-app/issues/11773
		defaultsDefines.process = { env: {} };
	}

	const modifyDefines = getHookFn(modifyDefinesHook, (defines) => defines);
	const customizedDefines = modifyDefines(defaultsDefines);

	console.log("allDefines", customizedDefines);

	return ({
		...config,

		plugins: [
			// want the hardcoding to happen first
			new (webpackContext.getStore()).DefinePlugin(customizedDefines),

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
