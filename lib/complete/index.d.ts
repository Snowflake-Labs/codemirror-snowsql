import { SnowClient, SnowConfig } from '../client/snow';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
export interface CompleteStrategy {
    snowSQL(context: CompletionContext): Promise<CompletionResult | null> | CompletionResult | null;
}
export interface CompleteConfiguration {
    remote?: SnowConfig | SnowClient;
    maxMetricsMetadata?: number;
    completeStrategy?: CompleteStrategy;
}
export declare function newCompleteStrategy(conf?: CompleteConfiguration): CompleteStrategy;
