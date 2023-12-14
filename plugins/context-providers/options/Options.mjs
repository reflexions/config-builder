import optionsContext from "./OptionsContext.mjs";

export const productionSymbol = Symbol('productionSymbol');
export const publicUrlSymbol = Symbol('publicUrlSymbol');
export const listenHostSymbol = Symbol('listenHostSymbol');
export const listenPortSymbol = Symbol('listenPortSymbol');
export const hmrClientListenPortSymbol = Symbol('hmrClientListenPortSymbol');
export const hmrClientPublicUrlSymbol = Symbol('hmrClientPublicUrlSymbol');
export const shouldUseReactRefreshSymbol = Symbol('shouldUseReactRefreshSymbol');

export const getIsProduction = () => optionsContext.getStore().get(productionSymbol);
export const getPublicUrl = () => optionsContext.getStore().get(publicUrlSymbol);
export const getListenHost = () => optionsContext.getStore().get(listenHostSymbol);
export const getListenPort = () => optionsContext.getStore().get(listenPortSymbol);
export const getHmrClientListenPort = () => optionsContext.getStore().get(hmrClientListenPortSymbol);
export const getHmrClientPublicUrl = () => optionsContext.getStore().get(hmrClientPublicUrlSymbol);
export const getShouldUseReactRefresh = () => optionsContext.getStore().get(shouldUseReactRefreshSymbol);
