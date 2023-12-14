import stringToBoolean from "@reflexions/string-to-boolean";
import {
	getHmrClientListenPort,
	getListenPort,
	getPublicUrl,
	hmrClientListenPortSymbol,
	hmrClientPublicUrlSymbol,
	listenHostSymbol,
	listenPortSymbol,
	productionSymbol,
	publicUrlSymbol,
	shouldUseReactRefreshSymbol,
} from "./Options.mjs";
import optionsContext from "./OptionsContext.mjs";
import runPlugins from "../../../RunPlugins.mjs";

const optionsFromEnvPlugin = async (passthrough) => {
	const options = optionsContext.getStore();

	// isProduction
	options.set(productionSymbol, process.env.NODE_ENV === 'production');

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

	console.log("options", options);

	return passthrough;
};

const optionsFromEnvCrumb = Symbol(optionsFromEnvPlugin.name);

export default {
	name: optionsFromEnvPlugin.name,
	main: (passthrough) => optionsFromEnvPlugin(passthrough),
	crumb: optionsFromEnvCrumb,
};
