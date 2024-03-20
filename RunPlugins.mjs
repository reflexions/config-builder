import { breadcrumbContext } from "./BreadcrumbContext.mjs";
import { validate } from "schema-utils";
import pluginSchema from "./PluginSchema.mjs";
import availableHooksContext from "./AvailableHooksContext.mjs";


export const getHook = (hookSymbol, defaultImplementation = undefined) => {
	// the first element is the latest version of the hook that overrode the others in the array
	return availableHooksContext.getStore().get(hookSymbol)?.[ 0 ] ?? defaultImplementation;
};

/**
 * Looks up hookSymbol
 * If the hook isn't defined, uses defaultImplementation
 *
 * Calls that function with args
 * Returns the result
 *
 * @param hookSymbol
 * @param defaultImplementation
 * @param args
 * @returns {*}
 */
export const getHookFnResult = (hookSymbol, defaultImplementation = undefined, args = []) => {
	const oldStore = availableHooksContext.getStore();
	const existingHookList = oldStore.get(hookSymbol);

	// create a new hook list for this call that includes the defaultImplementation
	const newHookList = [
		...existingHookList ?? [],
		defaultImplementation,
	];
	const newStore = new Map(oldStore);
	newStore.set(hookSymbol, newHookList);

	const value = newHookList[ 0 ];

	return availableHooksContext.run(newStore, () =>
		value(...args)
	);
}

const runPlugins = async plugins => {
	const hooks = availableHooksContext.getStore() ?? new Map();
	const breadcrumb = breadcrumbContext.getStore();
	const breadcrumbStr = breadcrumb.map(symbol => symbol.description).join("/");

	for (const plugin of plugins) {
		// validate the shape of the plugin object
		validate(pluginSchema, plugin, { name: `${breadcrumbStr}/${plugin.name}` });

		// register the plugin's hooks
		// keep a list of previous registrations of the same hook so that the one that gets called can call the others if it chooses
		plugin.hooks?.forEach(
			(callback, key) => hooks.set(key,
				// unshifts callback, returning the new array
				[ callback, ...(hooks.get(key) || []) ]
			)
		);
	}

	console.info("buildConfig validated plugins and registered hooks");

	return await availableHooksContext.run(hooks, async () => {
		let config;
		for (const plugin of plugins) {
			if (plugin.main) {
				console.info(`${breadcrumbStr} calling plugin ${plugin.name}`);
				config = await breadcrumbContext.run([ ...breadcrumb, plugin.crumb ], async () =>
					await plugin.main(config)
				);
			}
			else {
				// this plugin only registers hooks
			}
		}
		return config;
	});
};

export default runPlugins;
