import { IItem } from ".";

export interface IBatchPushError<I> extends IItem<I> {
    error: string;
}