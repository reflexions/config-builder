// This alternative WebpackDevServer combines the functionality of:
// https://github.com/webpack/webpack-dev-server/blob/webpack-1/client/index.js
// https://github.com/webpack/webpack/blob/webpack-1/hot/dev-server.js

// It only supports their simplest configuration (hot updates on same server).
// It makes some opinionated choices on top, like adding a syntax error overlay
// that looks similar to our console output. The error overlay is inspired by:
// https://github.com/glenjamin/webpack-hot-middleware

// HACK ALERT: Most of this file is identical to the webpackHotDevClient.js file with the exception of the code blocks
// denoted with //--- START Unique code --- and //--- END Unique code
// This was done to avoid getting a warning about the `createSocketURL` vs `createSocketUrl` file names
// You must keep the code in these two files in sync

// note that Webpack doesn't support HMR for modules yet, so this file is cjs
const stripAnsi = require("strip-ansi");
const launchEditorEndpoint = require("react-dev-utils/launchEditorEndpoint.js");
const formatWebpackMessages = require("./formatWebpackMessages.mjs").default;

const ErrorOverlay = require("react-error-overlay");
//--- START Unique code ---
// This code is unique to webpack-dev-server v4
// The single API changed to 2 APIs in v4, first you parse the URL, then you create the socket URL from the parsed data
const { createSocketURL, parseURL } = require("webpack-dev-server/client");

const socketUrl = createSocketURL(parseURL());

const parsedSocketUrl = new URL(socketUrl);

//const hotness = import.meta; // if using esmodules
const hotness = module.hot; // if using commonjs

if (hotness) {
	ErrorOverlay.setEditorHandler(function editorHandler(errorLocation) {
		// Keep this sync with errorOverlayMiddleware.js
		parsedSocketUrl.pathname = launchEditorEndpoint;
		parsedSocketUrl.search =
			"?fileName=" +
			window.encodeURIComponent(errorLocation.fileName) +
			"&lineNumber=" +
			window.encodeURIComponent(errorLocation.lineNumber || 1) +
			"&colNumber=" +
			window.encodeURIComponent(errorLocation.colNumber || 1);
		fetch(parsedSocketUrl.href, { mode: "no-cors" });
	});

	// We need to keep track of if there has been a runtime error.
	// Essentially, we cannot guarantee application state was not corrupted by the
	// runtime error. To prevent confusing behavior, we forcibly reload the entire
	// application. This is handled below when we are notified of a compile (code
	// change).
	// See https://github.com/facebookincubator/create-react-app/issues/3096
	let hadRuntimeError = false;
	ErrorOverlay.startReportingRuntimeErrors({
		onError: () => {
			hadRuntimeError = true;
		},
		filename: process.env.REACT_BUNDLE_PATH || "/static/js/bundle.js",
	});

	hotness.dispose((data) => {
		// TODO: why do we need this?
		ErrorOverlay.stopReportingRuntimeErrors();
	});

	//--- START Unique code ---
	// This code is unique to webpack-dev-server v4
	const connection = new WebSocket(socketUrl);
	//--- END Unique code ---

	// Unlike WebpackDevServer client, we won't try to reconnect
	// to avoid spamming the console. Disconnect usually happens
	// when developer stops the server.
	connection.onclose = () => {
		if (typeof console !== "undefined" && typeof console.info === "function") {
			console.info(
				"The development server has disconnected.\nRefresh the page if necessary.",
			);
		}
	};

	// Remember some state related to hot module replacement.
	let isFirstCompilation = true;
	let mostRecentCompilationHash = null;
	let hasCompileErrors = false;

	function clearOutdatedErrors() {
		// Clean up outdated compile errors, if any.
		if (typeof console !== "undefined" && typeof console.clear === "function") {
			if (hasCompileErrors) {
				console.clear();
			}
		}
	}

	// Successful compilation.
	function handleSuccess() {
		clearOutdatedErrors();

		const isHotUpdate = !isFirstCompilation;
		isFirstCompilation = false;
		hasCompileErrors = false;

		// Attempt to apply hot updates or reload.
		if (isHotUpdate) {
			tryApplyUpdates(function onHotUpdateSuccess() {
				// Only dismiss it when we're sure it's a hot update.
				// Otherwise it would flicker right before the reload.
				tryDismissErrorOverlay();
			});
		}
	}

	// Compilation with warnings (e.g. ESLint).
	function handleWarnings(warnings) {
		clearOutdatedErrors();

		const isHotUpdate = !isFirstCompilation;
		isFirstCompilation = false;
		hasCompileErrors = false;

		function printWarnings() {
			// Print warnings to the console.
			const formatted = formatWebpackMessages({
				warnings: warnings,
				errors: [],
			});

			if (
				typeof console !== "undefined" &&
				typeof console.warn === "function"
			) {
				for (let i = 0; i < formatted.warnings.length; i++) {
					if (i === 5) {
						console.warn(
							"There were more warnings in other files.\n" +
								"You can find a complete log in the terminal.",
						);
						break;
					}
					console.warn(stripAnsi(formatted.warnings[i]));
				}
			}
		}

		// Attempt to apply hot updates or reload.
		if (isHotUpdate) {
			tryApplyUpdates(function onSuccessfulHotUpdate() {
				// Only print warnings if we aren't refreshing the page.
				// Otherwise they'll disappear right away anyway.
				printWarnings();
				// Only dismiss it when we're sure it's a hot update.
				// Otherwise it would flicker right before the reload.
				tryDismissErrorOverlay();
			});
		} else {
			// Print initial warnings immediately.
			printWarnings();
		}
	}

	// Compilation with errors (e.g. syntax error or missing modules).
	function handleErrors(errors) {
		clearOutdatedErrors();

		isFirstCompilation = false;
		hasCompileErrors = true;

		// "Massage" webpack messages.
		const formatted = formatWebpackMessages({
			errors: errors,
			warnings: [],
		});

		// Only show the first error.
		ErrorOverlay.reportBuildError(formatted.errors[0]);

		// Also log them to the console.
		if (typeof console !== "undefined" && typeof console.error === "function") {
			for (const i = 0; i < formatted.errors.length; i++) {
				console.error(stripAnsi(formatted.errors[i]));
			}
		}

		// Do not attempt to reload now.
		// We will reload on next success instead.
	}

	function tryDismissErrorOverlay() {
		if (!hasCompileErrors) {
			ErrorOverlay.dismissBuildError();
		}
	}

	// There is a newer version of the code available.
	function handleAvailableHash(hash) {
		// Update last known compilation hash.
		mostRecentCompilationHash = hash;
	}

	// Handle messages from the server.
	connection.onmessage = (e) => {
		const message = JSON.parse(e.data);
		switch (message.type) {
			case "hash":
				handleAvailableHash(message.data);
				break;
			case "still-ok":
			case "ok":
				handleSuccess();
				break;
			case "content-changed":
				// Triggered when a file from `contentBase` changed.
				window.location.reload();
				break;
			case "warnings":
				handleWarnings(message.data);
				break;
			case "errors":
				handleErrors(message.data);
				break;
			default:
			// Do nothing.
		}
	};

	// Is there a newer version of this code available?
	function isUpdateAvailable() {
		/* globals __webpack_hash__ */
		// __webpack_hash__ is the hash of the current compilation.
		// It's a global variable injected by Webpack.
		return mostRecentCompilationHash !== __webpack_hash__;
	}

	// Webpack disallows updates in other states.
	function canApplyUpdates() {
		return hotness.status() === "idle";
	}

	// Attempt to update code on the fly, fall back to a hard reload.
	function tryApplyUpdates(onHotUpdateSuccess) {
		if (!hotness) {
			console.log(
				"HotModuleReplacementPlugin is not in Webpack configuration.",
			);
			window.location.reload();
			return;
		}

		if (!isUpdateAvailable() || !canApplyUpdates()) {
			return;
		}

		function handleApplyUpdates(err, updatedModules) {
			console.log("handleApplyUpdates");
			const hasReactRefresh = process.env.FAST_REFRESH;
			const wantsForcedReload = err || !updatedModules || hadRuntimeError;
			// React refresh can handle hot-reloading over errors.
			if (!hasReactRefresh && wantsForcedReload) {
				window.location.reload();
				return;
			}

			if (typeof onHotUpdateSuccess === "function") {
				// Maybe we want to do something.
				onHotUpdateSuccess();
			}

			if (isUpdateAvailable()) {
				// While we were updating, there was a new update! Do it again.
				tryApplyUpdates();
			}
		}

		// https://webpack.github.io/docs/hot-module-replacement.html#check
		const result = hotness.check(/* autoApply */ true, handleApplyUpdates);

		// // Webpack 2 returns a Promise instead of invoking a callback
		if (result && result.then) {
			result.then(
				(updatedModules) => {
					handleApplyUpdates(null, updatedModules);
				},
				(err) => {
					handleApplyUpdates(err, null);
				},
			);
		}
	}
} else {
	console.log("hotness not defined");
}
