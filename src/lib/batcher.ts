/**
 * Batcher Class that is used for the BatchRequester library
 * @module BatchRequester
 * @license MIT
 */

import { IBatchesContainItems, IBatchPushError, IBatchRequestsOptions, IGetDataCallback, IMappingFunction, IPromisesInFlight } from "../domain";
import Batch from "./batch";
import { FlattenArray } from "./utils";

/**
 *
 * @since 0.0.1
 * @export
 * @class Batcher
 * @template Input The input type of items that is going to be pushed into the batch
 * @template PreTransform The type of data that the data function responds with
 * @template Output The type of data that the mapping function responds with
 */
export default class Batcher<Input, PreTransform, Output> {

    /**
     *
     * @summary The number of ms to wait for the _waitTimeout setTimeout before processing begins
     * @private
     * @type {number}
     * @memberof Batch
     */
    private _delayBetweenRequests: number;

    /**
     *
     * @summary Reference to the custom provided mapping function
     * @private
     * @type {IGetDataCallback<Input, PreTransform>}
     * @memberof Batch
     */
    private _mappingFunction: IMappingFunction<Input, PreTransform, Output>;

    /**
     *
     * @summary Reference to the custom provided data function
     * @private
     * @type {IGetDataCallback<Input, PreTransform>}
     * @memberof Batch
     */
    private _dataFunction: IGetDataCallback<Input, PreTransform>;

    /**
     *
     * @summary The maximum size that the batch items array can grow to
     * @private
     * @type {number}
     * @memberof Batch
     */
    private _maxSize: number;

    /**
     *
     * @summary A simple number of ms that is the maximum amount of time the data function can take before timing out
     * @private
     * @type {number}
     * @memberof Batch
     */
    private _maxDataFetchTime: number;

    /**
     *
     * @summary Array of batches
     * @todo Move array to be set/weakSet
     * @private
     * @type {Array<Batch<Input, PreTransform>>}
     * @memberof Batcher
     */
    private _batches: Array<Batch<Input, PreTransform>>;

    constructor(opts: IBatchRequestsOptions<Input, PreTransform, Output>) {

        const DELAY_BETWEEN_REQUESTS = 100;
        const MAX_SIZE = 1000;
        const MAX_TIME = 5000;

        this._validateConstructorParameters(opts);

        this._delayBetweenRequests = opts.delay || DELAY_BETWEEN_REQUESTS;

        this._maxSize = opts.maxBatchSize || MAX_SIZE;
        this._maxDataFetchTime = opts.maxTime || MAX_TIME;

        this._dataFunction = opts.getDataCallback;
        this._mappingFunction = opts.mappingCallback;

        this._batches = [];

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

        input = this._validateMakeRequest(input);

        const { itemsToGet, promisesToWaitFor } = this._getPromisesForItemsInFlight(input);

        let promiseAll = [...promisesToWaitFor];

        if (itemsToGet.length) promiseAll = promiseAll.concat(this._getBatchPromises(itemsToGet));

        const RESPONSE = await Promise.all(promiseAll);

        return this._mappingFunction(input, FlattenArray<PreTransform>(RESPONSE));

    }

    /**
     *
     * @summary Creates a batch and updates latest batch
     * @description Function simply creates a new batch based on the constructor arguments and then pushes it into the batches array ready for use. Once
     * this is completed, the newly created batch is then returned.
     * @todo Move the Batch type to be injected into the constructor
     * @private
     * @returns {Batch<Input, PreTransform>} The newly created batch
     * @memberof Batcher
     */
    private _createNewBatch(): Batch<Input, PreTransform> {

        const NEW_BATCH = new Batch(this._delayBetweenRequests, this._dataFunction, this._maxSize, this._maxDataFetchTime);

        this._batches.push(NEW_BATCH);

        return NEW_BATCH;

    }

    /**
     *
     * @summary Returns the latest batch
     * @description Gets the last item index in the batches array and then returns the said index item
     * @readonly
     * @private
     * @type {(Batch<Input, PreTransform> | boolean)}
     * @memberof Batcher
     */
    private get _latestBatch(): Batch<Input, PreTransform> | boolean {

        const LENGTH = this._batches.length;

        return LENGTH > 0 ? this._batches[LENGTH - 1] : false;

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

        this._batches.forEach((batch: Batch<Input, PreTransform>) => batch.checkIfBatchContains(input, "included").forEach((elem: Input) => BATCHES.push({
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

        let batch = this._latestBatch as Batch<Input, PreTransform>;

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
    private _getPromisesForItemsInFlight(input: Input[]): IPromisesInFlight<Input, PreTransform> {

        const IN_FLIGHT_ITEMS = this._checkIfLatestBatchContains(input);
        const PROMISES_TO_WAIT_FOR = new Set();

        // Input is cloned, so filter can be applied without removing original elements
        let itemsToGet = [...input];

        IN_FLIGHT_ITEMS.forEach((inFlightItem) => {
            PROMISES_TO_WAIT_FOR.add(inFlightItem.batch);
            itemsToGet = itemsToGet.filter((item) => inFlightItem.item !== item);
        });

        return {
            itemsToGet,
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
     * @todo Move the array conversion to a seperate function as function should return void
     * @private
     * @param {(Input[] | Input)} input Input item(s) to be validated
     * @returns {Input[]} Input items that have been converted to array
     * @memberof Batcher
     */
    private _validateMakeRequest(input: Input[] | Input): Input[] {

        if (input === undefined) throw new Error("No input data provided");

        if (!Array.isArray(input) && !["bigint", "number", "string"].includes(typeof input)) throw new Error("Input data must be string, number or bigint");

        if (!Array.isArray(input)) input = [input];

        if (input.length === 0 ) throw new Error("No input data provided");

        return input;

    }

}
