import { IBatchRequesterOptions } from "../../domain/batchRequesterOptions";
import { AutoBatcher } from "./autoBatcher";
import { AutoBatcherCache } from "./autoBatcherCache";

function BatchRequesterFactory<I, P, O>(
    opts: IBatchRequesterOptions<I, P, O>,
): AutoBatcher<I, P, O> {

    if (opts.cache) return new AutoBatcherCache<I, P, O>(opts);

    else return new AutoBatcher<I, P, O>(opts);

}

export function BatchRequester<Input, PreTransform, Output>(
    opts: IBatchRequesterOptions<Input, PreTransform, Output>,
): AutoBatcher<Input, PreTransform, Output> {
    return BatchRequesterFactory(opts);
}
