import Batch from "../lib/batch";

export interface IBatchesContainItems<T, U> {
    batch: Batch<T, U>;
    item: T;
}