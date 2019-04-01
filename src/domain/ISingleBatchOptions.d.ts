import { IBatchRequesterOptions, IDataFunction } from ".";

export interface ISingleBatchOptions<I, P, O> extends IBatchRequesterOptions<I, P, O> {
    dataFunction: IDataFunction<I, P>;
}