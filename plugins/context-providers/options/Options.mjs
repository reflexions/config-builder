import optionsContext from "./OptionsContext.mjs";

export const productionSymbol = Symbol('productionSymbol');
export const getIsProduction = () => optionsContext.getStore().get(productionSymbol);
export const publicUrlSymbol = Symbol('publicUrlSymbol');
export const getPublicUrl = () => optionsContext.getStore().get(publicUrlSymbol);
export const listenHostSymbol = Symbol('listenHostSymbol');
export const getListenHost = () => optionsContext.getStore().get(listenHostSymbol);
export const listenPortSymbol = Symbol('listenPortSymbol');
export const getListenPort = () => optionsContext.getStore().get(listenPortSymbol);
export const hmrClientListenPortSymbol = Symbol('hmrClientListenPortSymbol');
export const getHmrClientListenPort = () => optionsContext.getStore().get(hmrClientListenPortSymbol);
export const hmrClientPublicUrlSymbol = Symbol('hmrClientPublicUrlSymbol');
export const getHmrClientPublicUrl = () => optionsContext.getStore().get(hmrClientPublicUrlSymbol);
export const shouldUseReactRefreshSymbol = Symbol('shouldUseReactRefreshSymbol');
export const getShouldUseReactRefresh = () => optionsContext.getStore().get(shouldUseReactRefreshSymbol);
export const shouldCalculateResourceIntegrity = Symbol('shouldCalculateResourceIntegrity');
export const getShouldCalculateResourceIntegrity = () => optionsContext.getStore().get(shouldCalculateResourceIntegrity);
export const oldBrowserCompatibility = Symbol('oldBrowserCompatibility');
export const getOldBrowserCompatibility = () => optionsContext.getStore().get(oldBrowserCompatibility);
export const emotionSsr = Symbol('emotionSsr');
export const getEmotionSsr = () => optionsContext.getStore().get(emotionSsr);
export const debugStripped = Symbol('debugStripped');
export const getDebugStripped = () => optionsContext.getStore().get(debugStripped);
export const reactServerComponents = Symbol('reactServerComponents');
export const getReactServerComponents = () => optionsContext.getStore().get(reactServerComponents);
export const serverNodeArgs = Symbol('serverNodeArgs');
export const getServerNodeArgs = () => optionsContext.getStore().get(serverNodeArgs);

