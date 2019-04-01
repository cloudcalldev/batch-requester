import { IItem } from ".";

export interface IBatchesContainItems<I, P, O> extends IItem<I> {
    batch: Promise<P[]>;
}