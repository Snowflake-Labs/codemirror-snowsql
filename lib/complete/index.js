import { HybridComplete } from './hybrid';
import { CachedSnowClient, HTTPSnowClient } from '../client/snow';
function isSnowConfig(remoteConfig) {
    return remoteConfig.url !== undefined;
}
export function newCompleteStrategy(conf) {
    var _a;
    if (conf === null || conf === void 0 ? void 0 : conf.completeStrategy) {
        return conf.completeStrategy;
    }
    if (conf === null || conf === void 0 ? void 0 : conf.remote) {
        if (!isSnowConfig(conf.remote)) {
            return new HybridComplete(conf.remote, conf.maxMetricsMetadata);
        }
        return new HybridComplete(new CachedSnowClient(new HTTPSnowClient(conf.remote), (_a = conf.remote.cache) === null || _a === void 0 ? void 0 : _a.maxAge), conf.maxMetricsMetadata);
    }
    return new HybridComplete();
}
//# sourceMappingURL=index.js.map