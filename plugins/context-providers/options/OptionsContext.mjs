import { AsyncLocalStorage } from "node:async_hooks";

const optionsContext = new AsyncLocalStorage();
export default optionsContext;
