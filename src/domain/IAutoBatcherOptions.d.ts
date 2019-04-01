import { IBatchRequesterOptions, IDataFunction, IMappingCallback } from ".";

export interface IAutoBatcherOptions<I, P, O> extends IBatchRequesterOptions<I, P, O> {
    dataFunction: IDataFunction<I, P>;
    mappingCallback: IMappingCallback<I, P, O>;
}