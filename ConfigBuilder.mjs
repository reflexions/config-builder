import { breadcrumbContext } from "./BreadcrumbContext.mjs";
import runPlugins from "./RunPlugins.mjs";

/**
 * Provides a breadcrumbContext within which plugins can run
 * Plugins provide all other context and functionality
 *
 * @param plugins
 * @returns {Promise<void>}
 */
const configBuilder = async (plugins) =>
	breadcrumbContext.run([],
		async () => await runPlugins(plugins)
	)
export default configBuilder;
