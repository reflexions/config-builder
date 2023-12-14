# Config Builder

`ConfigBuilder` takes a list - often nested - of plugins and runs them in order, depth-first. It's plugins all the way down.

Each list is parsed by `runPlugins`, which keeps track of the level of nesting in `breadcrumbContext`. This bit of AsyncLocalStorage lets plugins and hooks inspect the context that they're called from.

Before running the plugins in the list, it gathers their hooks and registers them in `availableHooksContext`. Hooks registered later in the list override hooks registered earlier.

If a plugin wants to have configurable behavior, it can call a hook or give `runPlugins` a list of plugins to run.

The return value of the preceding plugin is passed to the next.


## Plugins

A plugin is an object with: `name`, `crumb`, `main`, and `hooks` fields. The plugin's structure is validated by PluginSchema.mjs

The crumb is a Symbol, and is appended to the `breadcrumbContext` when the plugin's `main` method is called. Plugins can call other plugins by calling `runPlugins`. `breadcrumbContext` represents the depth of plugins calling plugins. 

`hooks` is a `Map` with hook Symbols as the keys. The values are the value that will be returned for the hook.

A plugin that calls `runPlugins` can provide its own AsyncLocalStorage for those child plugins to consume.
Options are handled in that way, where the `OptionsContextPlugin` sets up the context for the `OptionsFromEnvPlugin` to write to and for the `get*` functions in `Options.mjs` to read from. You could create a separate options system using that same structure, or just have your plugin write to the same `OptionsContext`.


## Hooks

Hooks can return either a synchronous or asynchronous function or a raw value.

The convention is to use -SyncHook, -AsyncHook, or -Hook suffixes, respectively.

`getHook` returns the hook's value.

`getHookFn` calls the hook with the given parameters and returns the result.


## Misc

After building this, I realized that I was building yet another compiler.
Maybe I could've had Webpack build a config for Webpack, and get HMR of the builder.
Could've had a Webpack plugin watch for changes to .env, etc. Oh well.

One thing I do like about this that Webpack doesn't offer is the `AsyncLocalStorage` `breadcrumbContext`.
With that, a hook can know the context that it is being called from. That'd let you have one function handle e.g. the Babel settings for both node_modules and src but do things slightly differently depending on the context.

