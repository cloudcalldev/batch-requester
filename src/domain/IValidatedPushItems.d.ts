import { IBatchPushError } from ".";

export interface IValidatedPushItems<I> {
    errors: Array<IBatchPushError<I>>;
    itemsToPush: I[];
}