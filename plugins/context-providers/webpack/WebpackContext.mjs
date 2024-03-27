import { AsyncLocalStorage } from "node:async_hooks";

/** The Webpack default export */
const webpackContext = new AsyncLocalStorage();

export const getWebpack = () => webpackContext.getStore();
export default webpackContext;
