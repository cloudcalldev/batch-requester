import { IBatchPushError } from "./IBatchPushError";

export interface IValidatedPushItems<T> {
    errors: Array<IBatchPushError<T>>;
    itemsToPush: T[];
}