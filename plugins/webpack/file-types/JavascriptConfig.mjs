import {
	getEmotionSsr,
	getIsProduction,
	getOldBrowserCompatibility,
	getShouldUseReactRefresh,
} from "../../context-providers/options/Options.mjs";
import { getHookFnResult } from "../../../RunPlugins.mjs";
import { getIsNode } from "../SeparateNodeAndBrowserBuilds.mjs";
import {
	getTargetsHook,
} from "../../hooks/GetTargets.mjs";



export const presetEnvOptions = async (target, old_browser_compat) => {
	// https://babeljs.io/docs/en/babel-preset-env#options
	const options = {};

	// https://babeljs.io/docs/en/babel-preset-env#debug
	// Outputs messages like this:
	// Using targets:
	// {
	//   "chrome": "87",
	//   "edge": "88",
	//   "firefox": "78",
	//   "ie": "11",
	//   "ios": "14",
	//   "safari": "14",
	//   "samsung": "13"
	// }
	//
	// Using modules transform: auto
	//
	// Using plugins:
	//   proposal-numeric-separator { "ie":"11" }
	//   proposal-logical-assignment-operators { "firefox":"78", "ie":"11", "samsung":"13" }
	//   proposal-nullish-coalescing-operator { "ie":"11" }
	//   proposal-optional-chaining { "ie":"11" }
	// and for each file:
	// "Based on your code and targets, core-js polyfills were not added."
	// or a list of polyfills used per file like
	// [/var/www/html/node_modules/libphonenumber-js/es6/AsYouTypeFormatter.js]
	// The corejs3 polyfill added the following polyfills:
	//   es.regexp.constructor { "chrome":"87", "edge":"88", "firefox":"78", "ie":"11", "ios":"14", "safari":"14", "samsung":"13" }
	//   es.regexp.exec { "chrome":"87", "edge":"88", "firefox":"78", "ie":"11", "ios":"14", "safari":"14", "samsung":"13" }
	//   es.regexp.to-string { "chrome":"87", "edge":"88", "firefox":"78", "ie":"11", "ios":"14", "safari":"14", "samsung":"13" }
	//   es.string.replace { "chrome":"87", "edge":"88", "firefox":"78", "ie":"11", "ios":"14", "safari":"14", "samsung":"13" }
	//   es.string.match { "chrome":"87", "edge":"88", "firefox":"78", "ie":"11", "ios":"14", "safari":"14", "samsung":"13" }
	options.debug = true;

	// same list in postcss-options.js
	options.targets = await getHookFnResult(getTargetsHook, undefined, [ isNode ]);

	if (target === 'node' || !old_browser_compat) {
		// https://babeljs.io/docs/en/babel-preset-env#targetsesmodules
		options.targets.esmodules = true;
	}

	// https://babeljs.io/docs/en/babel-preset-env#modules
	// "Setting this to false will preserve ES modules."
	options.modules = false;

	options.bugfixes = true;

	// https://babeljs.io/docs/en/babel-preset-env#usebuiltins
	// disabling this because it's causing a "ReferenceError: require is not defined" client-side runtime error in prod builds
	// https://reflexions.slack.com/archives/C8KP2CGTZ/p1648491524080239?thread_ts=1648488747.832409&cid=C8KP2CGTZ
	// if we do need these corejs polyfills, let's add them ourselves in client.js
	// preset-env is still useful for non-polyfill stuff like rewriting syntax
	options.useBuiltIns = old_browser_compat && false
		? 'usage'
		: false;

	// https://babeljs.io/docs/en/babel-preset-env#corejs
	if (options.useBuiltIns) {
		options.corejs = {
			version: "3.21", // do include the minor version here. It should match the core-js version in package.json
			proposals: true,
		};
	}

	return options;
};

export const presetEnvPreset = async (target, old_browser_compat) => [
	'@babel/preset-env',
	await presetEnvOptions(target, old_browser_compat),
];

export const transformRuntimeOptions = ({
	// https://babeljs.io/docs/en/babel-plugin-transform-runtime#options
	// it wouldn't add corejs polyfills automatically without this
	corejs: {
		version: 3, // the major version. Don't include the minor
		proposals: true,
	},
	absoluteRuntime: true,
	version: "^7.20.7", // should match the @babel/runtime-corejs3 version in package.json
});

// disabling this because it's causing a "ReferenceError: require is not defined" client-side runtime error in prod builds
// https://reflexions.slack.com/archives/C8KP2CGTZ/p1648491524080239?thread_ts=1648488747.832409&cid=C8KP2CGTZ
export const transformRuntimePlugin = [
	"@babel/plugin-transform-runtime",
	transformRuntimeOptions,
];

const javascriptConfig = async ({ config, isProduction, isNode }) => {
	const old_browser_compat = !isNode && getOldBrowserCompatibility();
	console.log("old_browser_compat", old_browser_compat, isNode, typeof process.env.OLD_BROWSER_COMPAT, isProduction);
	const EMOTION_SSR = getEmotionSsr();
	return ({
		...config,

		module: {
			...config.module,

			rules: [
				...config.module?.rules ?? [],

				{
					exclude: [
						/node_modules/,
					],
					include: [
						"/var/www/html/src",
					],
					test: /\.(js|jsx|mjs|ts|tsx)$/,
					use: [
						{
							loader: "babel-loader",
							options: {
								babelrc: false,
								browserslistConfigFile: false,
								plugins: [
									// "Must be first"
									// We're not using emotion directly, but react-select uses it, so this helps avoid FOUC
									EMOTION_SSR && [
										// https://emotion.sh/docs/install#babelrc
										"@emotion",
										{ "sourceMap": true },
									],
									"@babel/plugin-proposal-class-properties",
									[
										"@babel/plugin-proposal-object-rest-spread",
										{
											useBuiltIns: true,
										},
									],
									[
										"@babel/plugin-proposal-record-and-tuple",
										{
											importPolyfill: true,
											syntaxType: "hash",
										},
									],
									old_browser_compat && transformRuntimePlugin,
									isProduction && [
										"babel-plugin-transform-react-remove-prop-types",
										{
											removeImport: true,
										},
									],
									//"@babel/plugin-transform-react-jsx-source",
									"@babel/plugin-transform-react-display-name",
									//dev && require.resolve('react-refresh/babel'),
									//dev && require.resolve('babel-preset-razzle/babel-plugins/no-anonymous-default-export'),
									getShouldUseReactRefresh() && !isProduction && !isNode && 'react-refresh/babel',
								].filter(x => x),
								presets: [
									[
										"@babel/preset-env",
										{
											bugfixes: true,
											debug: true,
											modules: false,
											targets: await getHookFnResult(getTargetsHook, undefined, [ isNode ]),
											useBuiltIns: false,
										},
									],
									[
										"@babel/preset-react",
										{
											// https://babeljs.io/docs/en/babel-preset-react#importsource
											importSource: Boolean(process.env.NODE_ENV === 'development' && process.env.WHY_DID_YOU_RENDER)
												? '@welldone-software/why-did-you-render'
												: 'react',
											runtime: "automatic",
										},
									],
								],
								sourceMaps: true,
								sourceType: "module",
								targets: await getHookFnResult(getTargetsHook, undefined, [ isNode ]),
							},
						},
					],
				},
			],
		},
	});
};

const attachJavascriptConfigCrumb = Symbol("attachJavascriptConfigCrumb");
const attachJavascriptConfig = async config => {
	const isProduction = getIsProduction();
	const isNode = getIsNode();
	return await javascriptConfig({ config, isProduction, isNode });
};

export default {
	name: attachJavascriptConfig.name,
	main: attachJavascriptConfig,
	crumb: attachJavascriptConfigCrumb,
};
