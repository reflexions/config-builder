#!/usr/bin/node
import reactSsrPlugins from "../plugin-sets/ReactSsrPlugin.mjs";
import configBuilder from "./ConfigBuilder.mjs";

const main = async () => {
	const plugins = await reactSsrPlugins();
	await configBuilder(plugins);
};

main()
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
