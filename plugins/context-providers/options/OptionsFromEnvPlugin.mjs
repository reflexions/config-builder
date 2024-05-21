import stringToBoolean from "@reflexions/string-to-boolean";
import {
	debugStripped,
	emotionSsr,
	getHmrClientListenPort,
	getListenPort,
	getMinimize,
	getPublicUrl,
	hmrClientListenPortSymbol,
	hmrClientPublicUrlSymbol,
	listenHostSymbol,
	listenPortSymbol,
	minimize,
	minimizeNode,
	minimizeBrowser,
	oldBrowserCompatibility,
	productionSymbol,
	publicUrlSymbol,
	reactServerComponents,
	serverNodeArgs,
	shouldCalculateResourceIntegrity,
	shouldUseReactRefreshSymbol,
} from "./Options.mjs";
import optionsContext from "./OptionsContext.mjs";

const optionsFromEnvPlugin = async (passthrough) => {
	const options = optionsContext.getStore();

	// isProduction
	const isProduction = process.env.NODE_ENV === 'production';
	options.set(productionSymbol, isProduction);

	// PUBLIC_URL
	// The URL that users enter into their browser
	const defaultPublicUrl = new URL('http://localhost');
	defaultPublicUrl.port = getListenPort();
	options.set(publicUrlSymbol, Object.freeze(new URL(process.env.PUBLIC_URL ?? defaultPublicUrl.href)));

	// LISTEN_HOST/PORT
	// The node build listens on a local adapter+port
	options.set(listenHostSymbol, process.env.LISTEN_HOST ?? "0.0.0.0");
	options.set(listenPortSymbol, parseInt(process.env.LISTEN_PORT ?? (getPublicUrl().port || 80), 10)); // URL.port returns '' if using protocol default, so use || not ??

	// Local dev builds listen on a separate URL for HMR of the browser build
	options.set(hmrClientListenPortSymbol, parseInt(process.env.CLIENT_LISTEN_PORT ?? (getListenPort() + 1), 10));

	const defaultHmrPublicUrl = new URL(getPublicUrl().href);
	defaultHmrPublicUrl.port = getHmrClientListenPort();
	options.set(hmrClientPublicUrlSymbol, Object.freeze(new URL(process.env.HMR_PUBLIC_URL ?? defaultHmrPublicUrl.href)));

	options.set(shouldUseReactRefreshSymbol, stringToBoolean(process.env.SHOULD_USE_REACT_REFRESH ?? false));

	options.set(shouldCalculateResourceIntegrity, stringToBoolean(process.env.RESOURCE_INTEGRITY ?? isProduction));
	options.set(oldBrowserCompatibility, stringToBoolean(process.env.OLD_BROWSER_COMPAT ?? isProduction));
	options.set(emotionSsr, stringToBoolean(process.env.EMOTION_SSR ?? isProduction));
	options.set(debugStripped, stringToBoolean(process.env.DEBUG_STRIPPED ?? isProduction));
	options.set(reactServerComponents, stringToBoolean(process.env.REACT_SERVER_COMPONENTS ?? false));
	options.set(serverNodeArgs, JSON.parse(process.env.SERVER_NODE_ARGS ?? JSON.stringify(["--inspect=0.0.0.0:9229"])));

	options.set(minimize, stringToBoolean(process.env.MINIMIZE ?? isProduction));
	options.set(minimizeNode, stringToBoolean(process.env.MINIMIZE_NODE ?? getMinimize()));
	options.set(minimizeBrowser, stringToBoolean(process.env.MINIMIZE_BROWSER ?? getMinimize()));

	console.log("options", options);

	return passthrough;
};

const optionsFromEnvCrumb = Symbol(optionsFromEnvPlugin.name);

export default {
	name: optionsFromEnvPlugin.name,
	main: (passthrough) => optionsFromEnvPlugin(passthrough),
	crumb: optionsFromEnvCrumb,
};
