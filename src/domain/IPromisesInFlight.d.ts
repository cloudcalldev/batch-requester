export interface IPromisesInFlight<T, U> {
    itemsToGet: T[];
    promisesToWaitFor: Set<Promise<U[]>>;
}