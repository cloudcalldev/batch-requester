import { IItem } from ".";

export interface IAutoBatcherResponse<I, O> extends IItem<I> {
    value: O;
}