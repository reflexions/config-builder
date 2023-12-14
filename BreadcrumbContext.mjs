import { AsyncLocalStorage } from "node:async_hooks";

/** The list of which plugins called which plugins */
export const breadcrumbContext = new AsyncLocalStorage();
