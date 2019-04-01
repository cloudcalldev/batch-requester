import { CacheBucket } from "../lib/cache/cacheBucket";
import { SingleBatch } from "../lib/batch/singleBatch";

export type IMappingCallback<I, P, O> = (originalInput: I[], dataResponse: P[]) => O[];

export type IDataFunction<I, P> = (input: I[]) => P[];

export interface IItem<I> {
    item: I
}

export interface IBatchPushError<I> extends IItem<I> {
    error: string;
}

export interface IAutoBatcherResponse<I, O> extends IItem<I> {
    value: O;
}

export interface IBatchesContainItems<I, P, O> extends IItem<I> {
    batch: Promise<P[]>;
}

export interface IInFlightPromises<I, P, O> {
    itemsNotInFlight: I[];
    promisesToWaitFor: Set<Promise<P[]>>;
} 

export interface IValidatedPushItems<I> {
    errors: Array<IBatchPushError<I>>;
    itemsToPush: I[];
}

export interface IBatchRequesterOptions<I, P, O> {
    cache: CacheBucket;
    mappingCallback: IMappingCallback<I, P, O>;
    timeout: number;
    initialItems: I[];
    dataFunction: IDataFunction<I, P>;
    maxDataFetchTime: number;
    maxSize: number;
}
