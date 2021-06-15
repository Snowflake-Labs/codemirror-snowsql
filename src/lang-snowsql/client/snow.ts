

import { FetchFn } from '.';
import { Matcher } from '../types/matcher';
import { //labelMatchersToString 
} from '../parser/matcher';
import LRUCache from 'lru-cache';

const apiPrefix = '/api/v1';
const labelsEndpoint = apiPrefix + '/labels';
const labelValuesEndpoint = apiPrefix + '/label/:name/values';
const seriesEndpoint = apiPrefix + '/series';
const metricMetadataEndpoint = apiPrefix + '/metadata';

export interface MetricMetadata {
  type: string;
  help: string;
}

export interface SnowClient {
  labelNames(metricName?: string): Promise<string[]>;

  // labelValues return a list of the value associated to the given labelName.
  // In case a metric is provided, then the list of values is then associated to the couple <MetricName, LabelName>
  labelValues(labelName: string, metricName?: string, matchers?: Matcher[]): Promise<string[]>;

  metricMetadata(): Promise<Record<string, MetricMetadata[]>>;

  series(metricName: string, matchers?: Matcher[], labelName?: string): Promise<Map<string, string>[]>;

  // metricNames returns a list of suggestions for the metric name given the `prefix`.
  // Note that the returned list can be a superset of those suggestions for the prefix (i.e., including ones without the
  // prefix), as codemirror will filter these out when displaying suggestions to the user.
  metricNames(prefix?: string): Promise<string[]>;
}

export interface SnowConfig {
  url: string;
  lookbackInterval?: number;
  httpErrorHandler?: (error: any) => void;
  fetchFn?: FetchFn;
  cache?: {
    // maxAge is the maximum amount of time that a cached completion item is valid before it needs to be refreshed.
    // It is in milliseconds. Default value:  300 000 (5min)
    maxAge: number;
  };
}

interface APIResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  warnings?: string[];
}

// with an error encoded within the JSON.
const badRequest = 400;
const unprocessableEntity = 422;
const serviceUnavailable = 503;

export class HTTPSnowClient implements SnowClient {
  private readonly lookbackInterval = 60 * 60 * 1000 * 12; //12 hours
  private readonly url: string;
  private readonly errorHandler?: (error: any) => void;
  // For some reason, just assigning via "= fetch" here does not end up executing fetch correctly
  // when calling it, thus the indirection via another function wrapper.
  private readonly fetchFn: FetchFn = (input: RequestInfo, init?: RequestInit): Promise<Response> => fetch(input, init);

  constructor(config: SnowConfig) {
    this.url = config.url;
    this.errorHandler = config.httpErrorHandler;
    if (config.lookbackInterval) {
      this.lookbackInterval = config.lookbackInterval;
    }
    if (config.fetchFn) {
      this.fetchFn = config.fetchFn;
    }
  }

  labelNames(metricName?: string): Promise<string[]> {
    const end = new Date();
    const start = new Date(end.getTime() - this.lookbackInterval);
    if (metricName === undefined || metricName === '') {
      const params: URLSearchParams = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      return this.fetchAPI<string[]>(`${labelsEndpoint}?${params}`).catch((error) => {
        if (this.errorHandler) {
          this.errorHandler(error);
        }
        return [];
      });
    }

    return this.series(metricName).then((series) => {
      const labelNames = new Set<string>();
      for (const labelSet of series) {
        for (const [key] of Object.entries(labelSet)) {
          if (key === '__name__') {
            continue;
          }
          labelNames.add(key);
        }
      }
      return Array.from(labelNames);
    });
  }

  // labelValues return a list of the value associated to the given labelName.
  // In case a metric is provided, then the list of values is then associated to the couple <MetricName, LabelName>
  labelValues(labelName: string, metricName?: string, matchers?: Matcher[]): Promise<string[]> {
    const end = new Date();
    const start = new Date(end.getTime() - this.lookbackInterval);

    if (!metricName || metricName.length === 0) {
      const params: URLSearchParams = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      return this.fetchAPI<string[]>(`${labelValuesEndpoint.replace(/:name/gi, labelName)}?${params}`).catch((error) => {
        if (this.errorHandler) {
          this.errorHandler(error);
        }
        return [];
      });
    }

    return this.series(metricName, matchers, labelName).then((series) => {
      const labelValues = new Set<string>();
      for (const labelSet of series) {
        for (const [key, value] of Object.entries(labelSet)) {
          if (key === '__name__') {
            continue;
          }
          if (key === labelName) {
            labelValues.add(value);
          }
        }
      }
      return Array.from(labelValues);
    });
  }

  metricMetadata(): Promise<Record<string, MetricMetadata[]>> {
    return this.fetchAPI<Record<string, MetricMetadata[]>>(metricMetadataEndpoint).catch((error) => {
      if (this.errorHandler) {
        this.errorHandler(error);
      }
      return {};
    });
  }

  series(metricName: string, matchers?: Matcher[], labelName?: string): Promise<Map<string, string>[]> {
    const end = new Date();
    const start = new Date(end.getTime() - this.lookbackInterval);
    const params: URLSearchParams = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    //  'match[]': labelMatchersToString(metricName, matchers, labelName),
    });
    return this.fetchAPI<Map<string, string>[]>(`${seriesEndpoint}?${params}`).catch((error) => {
      if (this.errorHandler) {
        this.errorHandler(error);
      }
      return [];
    });
  }

  metricNames(): Promise<string[]> {
    return this.labelValues('__name__');
  }

  private fetchAPI<T>(resource: string): Promise<T> {
    return this.fetchFn(this.url + resource)
      .then((res) => {
        if (!res.ok && ![badRequest, unprocessableEntity, serviceUnavailable].includes(res.status)) {
          throw new Error(res.statusText);
        }
        return res;
      })
      .then((res) => res.json())
      .then((apiRes: APIResponse<T>) => {
        if (apiRes.status === 'error') {
          throw new Error(apiRes.error !== undefined ? apiRes.error : 'missing "error" field in response JSON');
        }
        if (apiRes.data === undefined) {
          throw new Error('missing "data" field in response JSON');
        }
        return apiRes.data;
      });
  }
}

class Cache {
  // completeAssociation is the association between a metric name, a label name and the possible label values
  private readonly completeAssociation: LRUCache<string, Map<string, Set<string>>>;
  // metricMetadata is the association between a metric name and the associated metadata
  private metricMetadata: Record<string, MetricMetadata[]>;
  private labelValues: LRUCache<string, string[]>;
  private labelNames: string[];

  constructor(maxAge: number) {
    this.completeAssociation = new LRUCache<string, Map<string, Set<string>>>(maxAge);
    this.metricMetadata = {};
    this.labelValues = new LRUCache<string, string[]>(maxAge);
    this.labelNames = [];
  }

  setAssociations(metricName: string, series: Map<string, string>[]): void {
    series.forEach((labelSet: Map<string, string>) => {
      let currentAssociation = this.completeAssociation.get(metricName);
      if (!currentAssociation) {
        currentAssociation = new Map<string, Set<string>>();
        this.completeAssociation.set(metricName, currentAssociation);
      }

      for (const [key, value] of Object.entries(labelSet)) {
        if (key === '__name__') {
          continue;
        }
        const labelValues = currentAssociation.get(key);
        if (labelValues === undefined) {
          currentAssociation.set(
            key,
            new Set<string>([value])
          );
        } else {
          labelValues.add(value);
        }
      }
    });
  }

  setMetricMetadata(metadata: Record<string, MetricMetadata[]>): void {
    this.metricMetadata = metadata;
  }

  getMetricMetadata(): Record<string, MetricMetadata[]> {
    return this.metricMetadata;
  }

  setLabelNames(labelNames: string[]): void {
    this.labelNames = labelNames;
  }

  getLabelNames(metricName?: string): string[] {
    if (!metricName || metricName.length === 0) {
      return this.labelNames;
    }
    const labelSet = this.completeAssociation.get(metricName);
    return labelSet ? Array.from(labelSet.keys()) : [];
  }

  setLabelValues(labelName: string, labelValues: string[]): void {
    this.labelValues.set(labelName, labelValues);
  }

  getLabelValues(labelName: string, metricName?: string): string[] {
    if (!metricName || metricName.length === 0) {
      const result = this.labelValues.get(labelName);
      return result ? result : [];
    }

    const labelSet = this.completeAssociation.get(metricName);
    if (labelSet) {
      const labelValues = labelSet.get(labelName);
      return labelValues ? Array.from(labelValues) : [];
    }
    return [];
  }
}

export class CachedSnowClient implements SnowClient {
  private readonly cache: Cache;
  private readonly client: SnowClient;

  constructor(client: SnowClient, maxAge = 5 * 60 * 1000) {
    this.client = client;
    this.cache = new Cache(maxAge);
  }

  labelNames(metricName?: string): Promise<string[]> {
    const cachedLabel = this.cache.getLabelNames(metricName);
    if (cachedLabel && cachedLabel.length > 0) {
      return Promise.resolve(cachedLabel);
    }

    if (metricName === undefined || metricName === '') {
      return this.client.labelNames().then((labelNames) => {
        this.cache.setLabelNames(labelNames);
        return labelNames;
      });
    }
    return this.series(metricName).then(() => {
      return this.cache.getLabelNames(metricName);
    });
  }

  labelValues(labelName: string, metricName?: string): Promise<string[]> {
    const cachedLabel = this.cache.getLabelValues(labelName, metricName);
    if (cachedLabel && cachedLabel.length > 0) {
      return Promise.resolve(cachedLabel);
    }

    if (metricName === undefined || metricName === '') {
      return this.client.labelValues(labelName).then((labelValues) => {
        this.cache.setLabelValues(labelName, labelValues);
        return labelValues;
      });
    }

    return this.series(metricName).then(() => {
      return this.cache.getLabelValues(labelName, metricName);
    });
  }

  metricMetadata(): Promise<Record<string, MetricMetadata[]>> {
    const cachedMetadata = this.cache.getMetricMetadata();
    if (cachedMetadata && Object.keys(cachedMetadata).length > 0) {
      return Promise.resolve(cachedMetadata);
    }

    return this.client.metricMetadata().then((metadata) => {
      this.cache.setMetricMetadata(metadata);
      return this.cache.getMetricMetadata();
    });
  }

  series(metricName: string): Promise<Map<string, string>[]> {
    return this.client.series(metricName).then((series) => {
      this.cache.setAssociations(metricName, series);
      return series;
    });
  }

  metricNames(): Promise<string[]> {
    return this.labelValues('__name__');
  }
}
