import { AsyncLocalStorage } from "node:async_hooks";

const availableHooksContext = new AsyncLocalStorage();
export default availableHooksContext;
