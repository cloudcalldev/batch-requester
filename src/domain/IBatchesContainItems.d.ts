import Batch from "../lib/batch/batch";

export interface IBatchesContainItems<T, U> {
    batch: Batch<T, U>;
    item: T;
}