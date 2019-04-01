import { IAutoBatcherOptions } from ".";
import { CacheBucket } from "../lib/cache/cacheBucket";

export interface IAutoBatcherCacheOptions<I, P, O> extends IAutoBatcherOptions<I, P, O> {
    cache: CacheBucket;
}