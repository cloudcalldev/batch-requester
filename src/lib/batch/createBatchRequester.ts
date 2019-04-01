import { IAutoBatcherCacheOptions, IAutoBatcherOptions } from "../../domain";
import { AutoBatcher } from "./autoBatcher";
import { AutoBatcherCache } from "./autoBatcherCache";

function BatchRequesterFactory<I, P, O>(
    opts: IAutoBatcherOptions<I, P, O>,
): AutoBatcher<I, P, O> {

    if (opts.cache) return new AutoBatcherCache<I, P, O>(opts as IAutoBatcherCacheOptions<I, P, O>);

    else return new AutoBatcher<I, P, O>(opts);

}

export function BatchRequester<Input, PreTransform, Output>(
    opts: IAutoBatcherOptions<Input, PreTransform, Output>,
): AutoBatcher<Input, PreTransform, Output> {
    return BatchRequesterFactory(opts);
}
