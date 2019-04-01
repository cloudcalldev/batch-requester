import { IBatchRequesterOptions } from "../../domain/batchRequesterOptions";
import { AutoBatcher } from "./autoBatcher";

export class AutoBatcherCache<I, P, O> extends AutoBatcher<I, P, O> {

    constructor(
        protected _opts: IBatchRequesterOptions<I, P, O>,
    ) {
        super(_opts);
    }

    protected _setCacheItems(data: any[]): void {

        const cache = this._opts.cache;

        if (cache) data.forEach((item) => cache.setItem(item.key, item.value));

    }

    protected _checkCache(input: I[]): any {

        const CACHED_ITEMS: P[] = [];
        let itemsNotInCache: I[] = [];

        const cache = this._opts.cache;

        if (cache) {

            input.forEach((item) => {

                const cachedValue = cache.getItem<P>(item);

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
