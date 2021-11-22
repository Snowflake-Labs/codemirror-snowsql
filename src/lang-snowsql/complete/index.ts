import { HybridComplete } from './hybrid';
import { CachedSnowClient, HTTPSnowClient, SnowClient, SnowConfig } from '../client/snow';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

// Complete is the interface that defines the simple method that returns a CompletionResult.
// Every different completion mode must implement this interface.
export interface CompleteStrategy {
  snowSQL(context: CompletionContext): Promise<CompletionResult | null> | CompletionResult | null;
}

// CompleteConfiguration should be used to customize the autocompletion.
export interface CompleteConfiguration {
  remote?: SnowConfig | SnowClient;
  // If the number of metrics exceeds this limit, no metric metadata is fetched at all.
  maxMetricsMetadata?: number;
  // When providing this custom CompleteStrategy, the settings above will not be used.
  completeStrategy?: CompleteStrategy;
}

function isSnowConfig(remoteConfig: SnowConfig | SnowClient): remoteConfig is SnowConfig {
  return (remoteConfig as SnowConfig).url !== undefined;
}

export function newCompleteStrategy(conf?: CompleteConfiguration): CompleteStrategy {
  if (conf?.completeStrategy) {
    return conf.completeStrategy;
  }
  if (conf?.remote) {
    if (!isSnowConfig(conf.remote)) {
      return new HybridComplete(conf.remote, conf.maxMetricsMetadata);
    }
    return new HybridComplete(new CachedSnowClient(new HTTPSnowClient(conf.remote), conf.remote.cache?.maxAge), conf.maxMetricsMetadata);
  }
  return new HybridComplete();
}
