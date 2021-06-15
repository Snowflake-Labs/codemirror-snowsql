export { SnowClient, SnowConfig } from './snow';

export type FetchFn = (input: RequestInfo, init?: RequestInit) => Promise<Response>;
