export default class ConfigBuilderPlugin {
	name;
	main;
	crumb;
	hooks;

	constructor({ name, main, crumb, hooks }) {
		this.name = name;
		this.main = main;
		this.crumb = crumb;
		this.hooks = hooks;
	}
}
