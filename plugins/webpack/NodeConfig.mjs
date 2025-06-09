import {
	getHmrClientPublicUrl,
	getIsProduction,
} from "../context-providers/options/Options.mjs";
import { getHookFnResult } from "../../RunPlugins.mjs";
import WaitForAssetsPlugin from "./webpack-plugins/WaitForAssetsPlugin.mjs";

/* https://webpack.js.org/configuration/target/#target */
export const getNodeTargetHook = Symbol("getNodeTargetHook");
/* https://babeljs.io/docs/options#targets */
export const getNodeTargetsHook = Symbol("getNodeTargetsHook");
export const getNodeOutputFilenameHook = Symbol("getNodeOutputFilenameHook");
export const getNodeOutputChunkFilenameHook = Symbol("getNodeOutputChunkFilenameHook");
export const getNodeLibraryTargetHook = Symbol("getNodeLibraryTargetHook");
export const getNodeExternalsHook = Symbol("getNodeExternalsHook");

const nodeVersion = process.versions.node;
const nodeVersionSplit = nodeVersion.split('.');
// https://webpack.js.org/configuration/target/
// with 'es2021', imports like 'fs' don't exit
const defaultWebpackNodeTarget = 'async-node' + nodeVersionSplit[ 0 ] + '.' + nodeVersionSplit[ 1 ];

const highestVersionSupportedByBrowserslist = (majorVersion, minorVersion) => {
	return nodeVersionSplit[ 0 ] + '.' + nodeVersionSplit[ 1 ];
};

export const defaultBrowserslistNodeTarget = 'node ' + highestVersionSupportedByBrowserslist(nodeVersionSplit[ 0 ], nodeVersionSplit[ 1 ]);

// Module HMR not supported yet https://github.com/webpack/webpack/issues/17636#issuecomment-1862935581
const outputModules = false;

const nodeConfig = async ({ config, isProduction }) => ({
	...config,

	target: await getHookFnResult(getNodeTargetHook, () => defaultWebpackNodeTarget),
	entry: {
		"server": [
			//"/var/www/html/node_modules/razzle-dev-utils/prettyNodeErrors.js",
			isProduction
				? null
				: "webpack/hot/dev-server", // razzle used webpack/hot/poll.js?300 instead
			"/var/www/html/src/index.js",
		].filter(x => x),
	},
	output: {
		...config.output,

		path: "/var/www/html/build",
		//publicPath: '/',
		publicPath: isProduction
			? '/'
			: getHmrClientPublicUrl().href,

		filename: await getHookFnResult(getNodeOutputFilenameHook, () => `[name].${isProduction
			? '[contenthash:8].'
			: ''}js`),
		chunkFilename: await getHookFnResult(getNodeOutputChunkFilenameHook, () => `[name].${isProduction
			? '[contenthash:8].'
			: ''}chunk.js`),

		/* deprecated https://webpack.js.org/configuration/output/#outputlibrarytarget */
		//libraryTarget: await getHookFnResult(getNodeLibraryTargetHook, () => "commonjs2"),
		library: {
			type: await getHookFnResult(getNodeLibraryTargetHook, () => outputModules ? "module" : "commonjs2"),
			name: "server",
		},

		environment: {
			// The environment supports arrow functions ('() => { ... }').
			arrowFunction: true,
			// The environment supports async function and await ('async function () { await ... }').
			asyncFunction: true,
			// The environment supports BigInt as literal (123n).
			bigIntLiteral: true,
			// The environment supports const and let for variable declarations.
			const: true,
			// The environment supports destructuring ('{ a, b } = obj').
			destructuring: true,
			// The environment supports an async import() function to import EcmaScript modules.
			dynamicImport: true,
			// The environment supports an async import() when creating a worker, only for web targets at the moment.
			dynamicImportInWorker: true,
			// The environment supports 'for of' iteration ('for (const x of array) { ... }').
			forOf: true,
			// The environment supports 'globalThis'.
			globalThis: true,
			// The environment supports ECMAScript Module syntax to import ECMAScript modules (import ... from '...').
			module: true,
			// The environment supports optional chaining ('obj?.a' or 'obj?.()').
			optionalChaining: true,
			// The environment supports template literals.
			templateLiteral: true,
		},
	},
	experiments: {
		outputModule: outputModules,

		// webpack has built-in support for css modules. Try it out?
		//css: true,
	},

	externals: await getHookFnResult(getNodeExternalsHook, () => ({
		appdynamics: "appdynamics",
		'@newrelic/native-metrics': '@newrelic/native-metrics',
		'newrelic': 'newrelic',
	})),

	plugins: [
		...config.plugins ?? [],

		new WaitForAssetsPlugin(),
	],
});

const attachNodeConfigCrumb = Symbol("attachNodeConfigCrumb");
const attachNodeConfig = async config => {
	const isProduction = getIsProduction();
	return await nodeConfig({ config, isProduction });
};

export default {
	name: attachNodeConfig.name,
	main: attachNodeConfig,
	crumb: attachNodeConfigCrumb,
};
