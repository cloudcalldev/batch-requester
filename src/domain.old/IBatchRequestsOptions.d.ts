import { IGetDataCallback } from "./IGetDataCallback";
import { IMappingFunction } from "./IMappingFunction";
import { CacheBucket } from "../lib/cache/cacheBucket";

export interface IBatchRequestsOptions<T, S, R> {
    getDataCallback: IGetDataCallback<T, S>;
    mappingCallback: IMappingFunction<T, S, R>;
    delay?: number;
    maxBatchSize?: number;
    maxTime?: number;
    cache?: CacheBucket;
}
