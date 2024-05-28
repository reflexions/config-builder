import stylisticJs from '@stylistic/eslint-plugin-js';
import babel from '@babel/eslint-plugin';
import { rules as emotionRules } from '@emotion/eslint-plugin';
import react from 'eslint-plugin-react';
import reactConfigsRecommended from 'eslint-plugin-react/configs/recommended.js';
import reactConfigsJsxRuntime from 'eslint-plugin-react/configs/jsx-runtime.js';
import { rules as importRules } from 'eslint-plugin-import';
import cssModules, { configs as cssModulesConfigs } from 'eslint-plugin-css-modules';
import reactHooks from 'eslint-plugin-react-hooks';
//import unusedImports from 'eslint-plugin-unused-imports';
import js from "@eslint/js";
import babelParser from "@babel/eslint-parser";
import globals from "globals";

export default [
	js.configs.recommended, // was "eslint:recommended",

	// eslint-plugin-import isn't updated yet
	// https://github.com/import-js/eslint-plugin-import/issues/2948
	// https://github.com/import-js/eslint-plugin-import/pull/2873
	// https://github.com/benmosher/eslint-plugin-import/blob/master/config/recommended.js
	// https://github.com/import-js/eslint-plugin-import/issues/2964#issuecomment-2119524178
	//importConfigs.recommended, // was "plugin:import/recommended",

	reactConfigsRecommended, // was "plugin:react/recommended",
	// https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html#removing-unused-react-imports
	reactConfigsJsxRuntime, // was "plugin:react/jsx-runtime"

	cssModulesConfigs.recommended,
	{
		plugins: {
			"react-hooks": reactHooks,
			"@stylistic/js": stylisticJs,
			"@emotion": {
				emotionRules,

				meta: {
					name: "@emotion/eslint-plugin",
				},
			},
			"@babel": babel,
			//"unused-imports": unusedImports,
			import: { rules: importRules },
			"css-modules": cssModules,
		},
		languageOptions: {
			parser: babelParser,
			sourceType: "module",
			ecmaVersion: 2021,
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2017,
				...globals.jest, // needed until we delete .test.js files or eslint ignore them
			},
			parserOptions: {
				requireConfigFile: false,
				ecmaFeatures: {
					jsx: true,
					classes: true,
				},
			},
		},
		rules: {
			// indentation
			// this is sometimes way off, so don't use: "CallExpression": {"arguments": "first"}
			"@stylistic/js/indent": [ "warn", "tab", { SwitchCase: 1 } ],

			// spacing
			"@stylistic/js/template-curly-spacing": [ "error", "never" ],
			"@stylistic/js/array-bracket-spacing": [ 2, "always" ],
			"@babel/object-curly-spacing": [ 2, "always" ],
			"@stylistic/js/computed-property-spacing": [ 2, "always" ],
			"@stylistic/js/no-multiple-empty-lines": [ "error",
				{ max: 10, maxEOF: 0, maxBOF: 0 },
			],
			"@stylistic/js/semi": [ "error" ],
			// strings
			//"quotes": [ 2, "double", "avoid-escape" ],

			// code arrangement matter
			"no-use-before-define": [ 2, { functions: false } ],
			"no-undef": "error",


			//"unused-imports/no-unused-imports": "error",

			// there's @stylistic/js/no-empty-pattern, but no-empty-pattern is also being applied
			"no-empty-pattern": "off",

			// make it meaningful
			"prefer-const": 1,

			"no-debugger": 1,

			// keep it simple
			complexity: [ 1, 10 ],

			// for gql, import from @apollo/client instead of graphql-tag
			//"import/no-named-as-default": "warn", // included by eslint:recommended

			// would be nice, but it's too slow to enable (import/namespace took 82.0%)
			//"import/namespace": 0,
			"import/no-cycle": [2, { ignoreExternal: true }],

			// we'll let the optimizer remove unused vars. Too many to fix manually.
			"no-unused-vars": [ "warn" ],

			"no-unreachable": "warn",

			// too many errors with this on:
			"react/prop-types": "off",

			"@stylistic/js/comma-dangle": [ "error", {
				arrays: "always-multiline",
				objects: "always-multiline",
				imports: "always-multiline",
				exports: "always-multiline",
				// https://eslint.org/docs/user-guide/migrating-to-6.0.0#-the-comma-dangle-rule-is-now-more-strict-by-default
				functions: "ignore",
			} ],

			"no-throw-literal": [ "error" ],

			"no-return-assign": [ "error", "always" ],

			// react
			//"react/prefer-es6-class": 1,
			//"react/jsx-curly-spacing": [ 2, "always" ],

			"react/display-name": "off", // doesn't support eslint flat config yet
			"react/no-direct-mutation-state": "off", // doesn't support eslint flat config yet
			"react/require-render-return": "off", // doesn't support eslint flat config yet
			"react/no-string-refs": "off", // doesn't support eslint flat config yet

			"react/jsx-uses-react": "off", // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-uses-react.md#when-not-to-use-it
			"react/react-in-jsx-scope": "off", // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/react-in-jsx-scope.md#when-not-to-use-it
			"react/jsx-uses-vars": "error", // required by no-unused-imports
			"react/jsx-filename-extension": 0,
			"react/jsx-indent": [ "error", "tab", {
				checkAttributes: true,
				indentLogicalExpressions: true,
			} ],
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "error",

			//"pkg-renaming": "error", // for @emotion


			// ==== start the import recommended rules ====
			// analysis/correctness
			//'import/no-unresolved': 'error', // not working yet with eslint flat config
			'import/named': 'error',
			//'import/namespace': 'error', // not working yet with eslint flat config
			//'import/default': 'error', // not working yet with eslint flat config
			'import/export': 'error',

			// red flags (thus, warnings)
			//'import/no-named-as-default': 'warn', // not working yet with eslint flat config
			//'import/no-named-as-default-member': 'warn', // not working yet with eslint flat config
			'import/no-duplicates': 'warn',
			// ==== end the import recommended rules ====
		},

		settings: {
			react: {
				version: "detect",
			},
			"import/resolver": {
				node: {
					// adds mjs to the list. Otherwise we get
					// "error  Unable to resolve path to module 'apollo-upload-client'  import/no-unresolved"
					extensions: [ ".js", ".mjs" ],
				},
				webpack: {
					config: {
						resolve: {
							modules: [
								"node_modules",
								"src",
							],
						},
					},
				},
			},
		},
	},
	{
		ignores: [
			"**/*.snap.js",
			"**/*.test.js",
			"__snapshots__",

			"**/node_modules/",
			"build/*",
			"coverage/lcov-report/*",
			"public/app-dynamics/adrum.js",

			"config-builder/**",
			"cubic-backoffice-types/**"
		]
	}
];
