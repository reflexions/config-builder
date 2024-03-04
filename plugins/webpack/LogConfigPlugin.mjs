import { writeFile } from "node:fs/promises";
import { productionSymbol } from "../context-providers/options/Options.mjs";
import optionsContext from "../context-providers/options/OptionsContext.mjs";
import { silentMkdir } from "../../utils/silentMkdir.mjs";

/**
 * Adds the constructor name to object values
 * @param {string} key
 * @param {any} value
 */
const jsonStringifyToObjectReplacer = (key, value) => {
	if (
		typeof value === 'object'
		&& value?.constructor?.name
		&& !['Object', 'Array'].includes(value.constructor.name)
	) {
		return sortKeys({
			...value,
			"_name": value.constructor.name,
		});
	}
	return sortKeys(value);
};

const sortKeys = obj => {
	if (obj?.constructor === Array) {
		return obj.map(i => sortKeys(i))
	}
	else if (obj && obj.constructor === Object) {
		return Object.entries(obj)
			.sort(([a], [b]) => a > b ? 1 : -1)
			.reduce((acc, entry) => {
				acc[ entry[ 0 ] ] = sortKeys(entry[ 1 ]);
				return acc;
			}, {});
	}
	return obj;
};

const logConfigPlugin = async (basePath, config) => {
	const prodOrDev = optionsContext.getStore().get(productionSymbol)
		? 'prod'
		: 'dev';

	await silentMkdir(basePath);

	// https://stackoverflow.com/a/12075970/329062
	Object.defineProperty(RegExp.prototype, "toJSON", {
		value: RegExp.prototype.toString,
	});

	await writeFile(`${basePath}/client-${prodOrDev}.config.json`, JSON.stringify(config[ 0 ], jsonStringifyToObjectReplacer, '\t'));
	await writeFile(`${basePath}/server-${prodOrDev}.config.json`, JSON.stringify(config[ 1 ], jsonStringifyToObjectReplacer, '\t'));

	console.info(JSON.stringify({ config }, jsonStringifyToObjectReplacer, '\t'));

	return config;
};

const logConfigCrumb = Symbol(logConfigPlugin.name);

const getPlugin = (basePath) => ({
	name: logConfigPlugin.name,
	crumb: logConfigCrumb,
	main: (config) => logConfigPlugin(basePath, config),
});

export default getPlugin;
