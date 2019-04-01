import { IAutoBatcherCacheOptions, IAutoBatcherResponse } from "../../domain";
import { ConvertToArray } from "../utils";
import { AutoBatcher } from "./autoBatcher";
import { Validate } from "./validate";

export class AutoBatcherCache<I, P, O> extends AutoBatcher<I, P, O> {

    constructor(
        protected _opts: IAutoBatcherCacheOptions<I, P, O>,
    ) {
        super(_opts);
    }

    public async makeRequest(input: I[] | I): Promise<O[]> {

        input = ConvertToArray(input);

        Validate.AutoBatcherMakeRequest<I>(input);

        const cachedValues: Array<IAutoBatcherResponse<I, O>> = this._checkCache(input);
        const itemsToGet = cachedValues.length > 0 ? input.filter((inputItem: I) => !cachedValues.map(({ item }) => item).includes(inputItem)) : [...input];

        let mappedResponse: Array<IAutoBatcherResponse<I, O>> = [];

        if (itemsToGet.length > 0)  {

            mappedResponse = this._opts.mappingCallback(input, await this._generateResponse(itemsToGet));

            this._setCacheItems(mappedResponse);

        }

        if (cachedValues.length > 0) mappedResponse = mappedResponse.concat(cachedValues);

        return mappedResponse.map(({value}: IAutoBatcherResponse<I, O>) => value);

    }

    protected _setCacheItems = (data: any[]): void => data.forEach(({item, value}) => this._opts.cache.setItem(item, value))

    protected _checkCache(input: I[]): Array<IAutoBatcherResponse<I, O>> {

        const CACHED_ITEMS: Array<IAutoBatcherResponse<I, O>> = [];

        input.forEach((item) => {

            const value = this._opts.cache.getItem<O>(item);

            if (value) CACHED_ITEMS.push({ item, value });

        });

        return CACHED_ITEMS;

    }

}
