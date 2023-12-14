import { AsyncLocalStorage } from "node:async_hooks";

/** The Webpack default export */
const webpackContext = new AsyncLocalStorage();
export default webpackContext;
