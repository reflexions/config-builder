import { breadcrumbContext } from "./BreadcrumbContext.mjs";
import { validate } from "schema-utils";
import pluginSchema from "./PluginSchema.mjs";
import availableHooksContext from "./AvailableHooksContext.mjs";


export const getHook = (hookSymbol, defaultImplementation = undefined) => (
	availableHooksContext.getStore().get(hookSymbol) ?? defaultImplementation
);

export const getHookFn = (hookSymbol, defaultImplementation = undefined, args = []) =>
	getHook(hookSymbol, defaultImplementation)(...args);

const runPlugins = async plugins => {
	const hooks = availableHooksContext.getStore() ?? new Map();
	const breadcrumb = breadcrumbContext.getStore();

	for (const plugin of plugins) {
		// validate the shape of the plugin object
		validate(pluginSchema, plugin, { name: `${breadcrumb.map(symbol => symbol.description).join("/")}/${plugin.name}` });

		// register the plugin's hooks
		plugin.hooks?.forEach((callback, key) => hooks.set(key, callback));
	}

	console.info("buildConfig validated plugins and registered hooks");

	return await availableHooksContext.run(hooks, async () => {
		let config;
		for (const plugin of plugins) {
			console.info(`buildConfig calling plugin ${plugin.name}`);
			config = await breadcrumbContext.run([ ...breadcrumb, plugin.crumb ], async () =>
				plugin.main
					? await plugin.main(config)
					// this plugin only registers hooks
					: config
			);
		}
		return config;
	});
};

export default runPlugins;
