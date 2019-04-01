import { SingleBatch } from "../lib/batch/singleBatch";

export interface IBatchesContainItems<T, U> {
    batch: SingleBatch<T, U>;
    item: T;
}