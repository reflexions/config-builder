import { setTimeout } from 'node:timers/promises';
import { access, readFile } from 'node:fs/promises';
import { constants } from "node:fs";
import { getAppAssetsManifest } from "../../context-providers/paths/Paths.mjs";
import {
	getHook,
	getHookFnResult,
} from "RunPlugins.mjs";

export const waitAttempts = Symbol('waitAttempts');
export const waitRetryTime = Symbol('waitRetryTime');

const pluginName = "WaitForAssetsPlugin";
const waitForAssetsJson = async () => {
	let attempts = 0;
	let done = false;
	const retryTime = getHookFnResult(waitRetryTime, () => 1_000);
	await new Promise(async (resolve, reject) => {
		const browserAssetsJson = getAppAssetsManifest();
		do {
			attempts++;
			try {
				await access(browserAssetsJson, constants.R_OK);

				done = true;
				resolve();
			}
			catch (error) {
				if (attempts > getHookFnResult(waitAttempts, () => 300)) {
					console.error(`${pluginName} gave up waiting`);
					console.error(error);
					done = true;
					reject();
				}
				else {
					if (attempts % 10 === 0) {
						console.info(`Waited ${attempts * retryTime / 1_000} sec for ${browserAssetsJson} from client build`);
					}
					await setTimeout(retryTime);
				}
			}
		} while (!done)
	});
};
export default class WaitForAssetsPlugin {
	static defaultOptions = {};

	// Any options should be passed in the constructor of your plugin,
	// (this is a public API of your plugin).
	constructor(options = {}) {
		// Applying user-specified options over the default options
		// and making merged options further available to the plugin methods.
		// You should probably validate all the options here as well.
		this.options = { ...WaitForAssetsPlugin.defaultOptions, ...options };
	}

	apply(compiler) {

		// webpack module instance can be accessed from the compiler object,
		// this ensures that correct version of the module is used
		// (do not require/import the webpack or any symbols from it directly).
		const { webpack } = compiler;

		// Compilation object gives us reference to some useful constants.
		const { Compilation } = webpack;

		// RawSource is one of the "sources" classes that should be used
		// to represent asset sources in compilation.
		const { RawSource } = webpack.sources;

		// Tapping to the "thisCompilation" hook in order to further tap
		// to the compilation process on an earlier stage.
		compiler.hooks.beforeCompile.tapPromise(pluginName, async (compilation, compilationParams) => {
			return await waitForAssetsJson();
		});

		compiler.hooks.thisCompilation.tap(pluginName, (compilation, compilationParams) => {
			// Tapping to the assets processing pipeline on a specific stage.
			compilation.hooks.processAssets.tapPromise(
				{
					name: pluginName,

					// Using one of the later asset processing stages to ensure
					// that all assets were already added to the compilation by other plugins.
					stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
				},
				async (assets) => {
					// "assets" is an object that contains all assets
					// in the compilation, the keys of the object are pathnames of the assets
					// and the values are file sources.

					// Iterating over all the assets and
					// generating content for our Markdown file.
					const content =
						'# In this build:\n\n' +
						Object.keys(assets)
							.map((filename) => `- ${filename}`)
							.join('\n');
					console.log(content);

					// Adding new asset to the compilation, so it would be automatically
					// generated by the webpack in the output directory.
					// make sure to add this to the watch ignore
					// compilation.emitAsset(
					// 	this.options.outputFile,
					// 	new RawSource(content)
					// );
				}
			);
		});
	}
}
