import { CacheBucket } from "../lib/cache/cacheBucket";
import { IMappingCallback, IDataFunction } from ".";

export interface IBatchRequesterOptions<I, P, O> {
    cache?: CacheBucket;
    mappingCallback?: IMappingCallback<I, P, O>;
    timeout?: number;
    initialItems?: I[] | I;
    dataFunction?: IDataFunction<I, P>;
    maxDataFetchTime?: number;
    maxSize?: number;
}