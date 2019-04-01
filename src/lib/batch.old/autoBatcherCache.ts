import { IBatchRequestsOptions } from "../../domain";
import { AutoBatcher } from "./autoBatcher";

export class AutoBatcherCache<Input, PreTransform, Output> extends AutoBatcher<Input, PreTransform, Output> {

    constructor(
        protected _opts: IBatchRequestsOptions<Input, PreTransform, Output>,
    ) {
        super(_opts);
    }

    protected _setCacheItems(data: any[]): void {

        const cache = this._opts.cache;

        if (cache) data.forEach((item) => cache.setItem(item.key, item.value));

    }

    protected _checkCache(input: Input[]): any {

        const CACHED_ITEMS: PreTransform[] = [];
        let itemsNotInCache: Input[] = [];

        const cache = this._opts.cache;

        if (cache) {

            input.forEach((item) => {

                const cachedValue = cache.getItem<PreTransform>(item);

                if (cachedValue) CACHED_ITEMS.push(cachedValue);

                else itemsNotInCache.push(item);

            });

        } else itemsNotInCache = input;

        return {
            cachedItems: CACHED_ITEMS,
            itemsNotInCache,
        };

    }

}
