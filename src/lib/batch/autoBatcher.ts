import { IAutoBatcherResponse, IBatchesContainItems, IBatchPushError, IBatchRequesterOptions, IInFlightPromises } from "../../domain/batchRequesterOptions";
import { ConvertToArray, FlattenArray } from "../utils";
import { Batches } from "./batches";
import { SingleBatch } from "./singleBatch";
import { Validate } from "./validate";

export class AutoBatcher<I, P, O> extends Batches<I, P, O> {

    constructor(
        protected _opts: IBatchRequesterOptions<I, P, O>,
    ) {

        super(_opts);

        Validate.AutoBatcherConstructor<I, P, O>(_opts);

    }

    public async makeRequest(input: I[] | I): Promise<Array<IAutoBatcherResponse<I, O>>> {

        input = ConvertToArray(input);

        Validate.AutoBatcherMakeRequest<I>(input);

        return await this._generateResponse(input);

    }

    private async _generateResponse(input: I[]): Promise<Array<IAutoBatcherResponse<I, O>>> {

        const { itemsNotInFlight, promisesToWaitFor } = this._getPromisesForItemsInFlight(input);

        let promiseAll: Array<Promise<P[]>> = [...promisesToWaitFor];

        if (itemsNotInFlight.length) promiseAll = promiseAll.concat(this._getBatchPromises(itemsNotInFlight));

        return FlattenArray<any>(await Promise.all(promiseAll));

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

    private _getPromisesForItemsInFlight(input: I[]): IInFlightPromises<I, P, O> {

        const promisesToWaitFor: Set<Promise<P[]>> = new Set();
        let itemsNotInFlight: I[] = [...input];

        this._checkIfLatestBatchContains(input).forEach(({batch, item}: IBatchesContainItems<I, P, O>) => {
            promisesToWaitFor.add(batch);
            itemsNotInFlight = itemsNotInFlight.filter((notInFlight: I) => item !== notInFlight);
        });

        return { itemsNotInFlight, promisesToWaitFor };

    }

}
