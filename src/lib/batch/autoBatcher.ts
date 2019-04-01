import { IAutoBatcherOptions, IAutoBatcherResponse, IBatchesContainItems, IBatchPushError } from "../../domain";
import { ConvertToArray, FlattenArray } from "../utils";
import { Batches } from "./batches";
import { SingleBatch } from "./singleBatch";
import { Validate } from "./validate";

export class AutoBatcher<I, P, O> extends Batches<I, P, O> {

    constructor(
        protected _opts: IAutoBatcherOptions<I, P, O>,
    ) {

        super(_opts);

        Validate.AutoBatcherConstructor<I, P, O>(_opts);

    }

    public async makeRequest(input: I[] | I): Promise<O[]> {

        input = ConvertToArray(input);

        Validate.AutoBatcherMakeRequest<I>(input);

        return this._opts.mappingCallback(input, await this._generateResponse(input)).map(({value}: IAutoBatcherResponse<I, O>) => value);

    }

    protected async _generateResponse(input: I[]): Promise<P[]> {

        const batchPromises: Array<IBatchesContainItems<I, P, O>> = this._checkIfLatestBatchContains(input);
        const itemsCateredFor: Set<I> = new Set(batchPromises.map(({item}) => item));
        let promiseAll: Array<Promise<P[]>> = [...new Set(batchPromises.map(({batch}) => batch))];

        input = input.filter((item) => !itemsCateredFor.has(item));

        if (input.length) promiseAll = promiseAll.concat(this._getBatchPromises(input));

        return FlattenArray<P>(await Promise.all(promiseAll));

    }

    private _allocateRequestsToBatches(input: I[]): Array<Promise<P[]>> {

        let batch = this._latestBatch as SingleBatch<I, P, O>;

        const BATCH_PROMISES = [batch.response];

        let nextBatchItems: I[] = input;

        while (nextBatchItems.length > 0) {

            const RESULTS: Array<IBatchPushError<I>> = batch.pushItemToBatch(nextBatchItems);

            nextBatchItems = RESULTS
                .filter(({error}: IBatchPushError<I>) => error === "Batch maximum size has been reached")
                .map(({item}: IBatchPushError<I>) => item);

            if (nextBatchItems.length > 0) {
                batch = this._createNewBatch();
                BATCH_PROMISES.push(batch.response);
            }

        }

        return BATCH_PROMISES;

    }

    private _getBatchPromises(input: I[]): Array<Promise<P[]>> {

        try {
            return this._allocateRequestsToBatches(input);
        } catch (err) {

            switch (err.message) {

                case "Cannot push items to a request that has already started":
                case "Batch Length Limit Reached":
                    this._createNewBatch();
                    return this._getBatchPromises(input);

                default:
                    throw err;

            }

        }

    }

}
