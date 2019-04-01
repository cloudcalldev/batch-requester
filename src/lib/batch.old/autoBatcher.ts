/**
 * Batcher Class that is used for the BatchRequester library
 * @module BatchRequester
 * @license MIT
 */

import {
    IBatchesContainItems,
    IBatchPushError,
    IBatchRequestsOptions,
} from "../../domain";
import { ConvertToArray, FlattenArray } from "../utils";
import { BatchesSet } from "./batchesSet";
import { SingleBatch } from "./singleBatch";

/**
 *
 * @since 0.0.1
 * @export
 * @class Batcher
 * @template Input The input type of items that is going to be pushed into the batch
 * @template PreTransform The type of data that the data function responds with
 * @template Output The type of data that the mapping function responds with
 */
export class AutoBatcher<Input, PreTransform, Output> extends BatchesSet<Input, PreTransform, Output> {

    constructor(
        protected _opts: IBatchRequestsOptions<Input, PreTransform, Output>,
    ) {

        super(_opts);

        this._validateConstructorParameters(_opts);

    }

    /**
     *
     * @summary Make a new request to the set data function and then map the data back using the mapping function
     * @description This function takes either an array of items or single items. On receipt these items will get validated and passed through the other functions to
     * establish what items are already have been request (stopping duplicate requests) and then will wait for all of the required batches to complete, before mapping
     * the returned data from the data function via the passed in mapping function. Once this is all completed, the function responds with the correct data.
     * @param {(Input[] | Input)} input An array or single item to request and batch into the data function
     * @returns {Promise<Output[]>} An array of items that relate to the input data
     * @memberof Batcher
     */
    public async makeRequest(input: Input[] | Input): Promise<Output[]> {

        input = ConvertToArray(input);

        this._validateMakeRequest(input);

        const mappedResponse = this._opts.mappingCallback(input, await this._generateResponse(input));

        return mappedResponse.map(({ value }: any) => value);

    }

    private async _generateResponse(input: Input[]): Promise<PreTransform[]> {

        const { itemsToGet, promisesToWaitFor } = this._reduceItemsToItemsToGet(input);

        let promiseAll = [...promisesToWaitFor];

        if (itemsToGet.length) promiseAll = promiseAll.concat(this._getBatchPromises(itemsToGet));

        return FlattenArray<PreTransform>(await Promise.all(promiseAll));

    }

    private _reduceItemsToItemsToGet(input: Input[]) {

        const { itemsNotInFlight, promisesToWaitFor } = this._getPromisesForItemsInFlight(input);

        return {
            itemsToGet: itemsNotInFlight,
            promisesToWaitFor,
        };

    }

    /**
     *
     * @summary Checks to see if any of the batches contains an array of items
     * @description Function that takes an array input and checks if any of the items are already included in the batches. If they are the item and the batch
     * promise is pushed to an array. Once all items have been checked in all batches, this array is then returned.
     * @todo Update batches constant type
     * @private
     * @param {Input[]} input An array of items to check for
     * @returns {Array<IBatchesContainItems<Input, PreTransform>>} An array of items already in progress with the corresponding batch response promise
     * @memberof Batcher
     */
    private _checkIfLatestBatchContains(input: Input[]): Array<IBatchesContainItems<Input, PreTransform>> {

        const BATCHES: any[] = [];

        this._batches.forEach((batch: SingleBatch<Input, PreTransform>) => batch.checkIfBatchContains(input, "included").forEach((elem: Input) => BATCHES.push({
            batch: batch.response,
            item: elem,
        })));

        return BATCHES;

    }

    /**
     *
     * @summary Simple function for constructor parameter validation
     * @description This function checks that the supplied constructor options are correct and valid. If there not, an error is thrown
     * @throws {Error} If options parameter is undefined
     * @throws {Error} If data function is undefined
     * @throws {Error} If data function is not a function
     * @throws {Error} If mapping function is undefined
     * @throws {Error} If mapping function is not a function
     * @private
     * @param {IBatchRequestsOptions<Input, PreTransform, Output>} opts
     * @memberof Batcher
     */
    private _validateConstructorParameters(opts: IBatchRequestsOptions<Input, PreTransform, Output>): void {

        if (!opts) throw new Error("Options parameter is required");

        if (!opts.getDataCallback) throw new Error("Data Callback is required");

        if (typeof opts.getDataCallback !== "function") throw new Error("Data Callback must be a function");

        if (!opts.mappingCallback) throw new Error("Mapping Callback is required");

        if (typeof opts.mappingCallback !== "function") throw new Error("Mapping Callback must be a function");

    }

    /**
     *
     * @summary Function takes an array of input items and pushes them to the correct batches
     * @description This function takes an array of input items and attempts to push them to the latest batch (if there isn't a latest batch; one is created). Once pushed
     * the response is checked to see if there are any errors to do with the batch size being exceeded, if this is the case a new batch is created and repeated. This is
     * done until all items have been added to a batch. Once this is completed, an array promises from the newly created batches is returned.
     * @todo Consider how nextBatchItems loop can be refactored to allow for the length to be checked only once
     * @private
     * @param {Input[]} input Unique array of items to be batched together
     * @returns {Array<Promise<PreTransform[]>>} Array of promises from the relevant batches that have been pushed to
     * @memberof Batcher
     */
    private _allocateRequestsToBatches(input: Input[]): Array<Promise<PreTransform[]>> {

        let batch = this._latestBatch as SingleBatch<Input, PreTransform>;

        if (!batch) batch = this._createNewBatch();

        const BATCH_PROMISES = [batch.response];

        let nextBatchItems = input;

        while (nextBatchItems.length > 0) {

            const RESULTS: Array<IBatchPushError<Input>> = batch.pushItemToBatch(nextBatchItems);

            nextBatchItems = RESULTS
                .filter((item: IBatchPushError<Input>) => item.error === "Batch maximum size has been reached")
                .map(({item}: IBatchPushError<Input>) => item);

            if (nextBatchItems.length > 0) {
                batch = this._createNewBatch();
                BATCH_PROMISES.push(batch.response);
            }

        }

        return BATCH_PROMISES;

    }

    /**
     *
     * @summary Function that allocates input items to batches
     * @description This function takes an array of elements and allocates them to the correct batches, if there are errors thrown, it conditionally manages them
     * @todo Refactor this function, flow logic shouldnt be in catch and errors need handling similar to individual item errors
     * @private
     * @param {Input[]} input Array of items to be added to batches
     * @returns {Array<Promise<PreTransform[]>>} Array of promises for the batches that have been created
     * @memberof Batcher
     */
    private _getBatchPromises(input: Input[]): Array<Promise<PreTransform[]>> {

        try {
            return this._allocateRequestsToBatches(input);
        } catch (err) {

            switch (err.message) {

                // These are retryable events on a new batch
                case "Cannot push items to a request that has already started":
                case "Batch Length Limit Reached":
                    this._createNewBatch();
                    return this._getBatchPromises(input);

                default:
                    throw err;

            }

        }

    }

    /**
     *
     * @summary Splits out the input items into two arrays, batches already inflight and new items to get
     * @description Checks if each of the input items is in progress in another batch elsewhere. If this is the case then an array of promises is returned for in progress
     * items. If not, then an array of new items to get is created and returned
     * @private
     * @param {Input[]} input Array of input items to check other batches for
     * @returns {IPromisesInFlight<Input, PreTransform>} A simple object that is split between two properies. An array of promises for items already inflight and
     * secondly a simple array of new items to get
     * @memberof Batcher
     */
    private _getPromisesForItemsInFlight(input: Input[]): any {

        const IN_FLIGHT_ITEMS = this._checkIfLatestBatchContains(input);
        const PROMISES_TO_WAIT_FOR = new Set();

        // Input is cloned, so filter can be applied without removing original elements
        let itemsNotInFlight = [...input];

        IN_FLIGHT_ITEMS.forEach((inFlightItem) => {
            PROMISES_TO_WAIT_FOR.add(inFlightItem.batch);
            itemsNotInFlight = itemsNotInFlight.filter((item) => inFlightItem.item !== item);
        });

        return {
            itemsNotInFlight,
            promisesToWaitFor: PROMISES_TO_WAIT_FOR,
        };

    }

    /**
     *
     * @summary Validates the input item(s) to check the data is correct
     * @descriptionm Takes the input item(s) and ensures the parameter is not empty and it is of the correct type.
     * @throws {Error} If input parameter is undefined
     * @throws {Error} If input parameter is not of the correct type
     * @throws {Error} If input parameter is an array and has length of 0
     * @private
     * @param {(Input[] | Input)} input Input item(s) to be validated
     * @returns {Input[]} Input items that have been converted to array
     * @memberof Batcher
     */
    private _validateMakeRequest(input: Input[]): void {
        if (input === undefined || input.length === 0 ) throw new Error("No input data provided");
    }

}
