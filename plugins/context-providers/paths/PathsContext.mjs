import { AsyncLocalStorage } from "node:async_hooks";

/** Stores filesystem paths, e.g. the app's root directory */
const pathsContext = new AsyncLocalStorage();
export default pathsContext;
