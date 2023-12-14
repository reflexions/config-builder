import { AsyncLocalStorage } from "node:async_hooks";

const compilationReportContext = new AsyncLocalStorage();
export default compilationReportContext;
