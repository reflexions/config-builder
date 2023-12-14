export default {
	type: "object",
	properties: {
		name: {
			typeof: "string",
		},
		main: {
			instanceof: "Function",
		},
		crumb: {
			typeof: "symbol",
		},
		hooks: {
			elements: {
				type: "Map"
			},
		},
	},
	required: [
		"name",
		"crumb"
	],
};
