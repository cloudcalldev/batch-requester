/**
 * Single Batch Class that is used for the BatchRequester library
 * @module BatchRequester
 * @license MIT
 */

import { IBatchPushError, IGetDataCallback, IProcessFailure, IProcessResponse, IValidatedPushItems } from "../../domain";
import { ConvertToArray } from "../utils";
import { SingleBatchItems } from "./singleBatchItems";

/**
 * @since 0.0.1
 * @internal
 * @export
 * @class Batch
 * @template Input The input type of items that is going to be pushed into the batch
 * @template PreTransform The type of data that the data function responds with
 */
export class SingleBatch<Input, PreTransform> {

    /**
     *
     * @summary The final array of items that will be passed to the data function
     * @private
     * @todo Update to be Set rather than Array
     * @type {Input[]}
     * @memberof SingleBatch
     */
    private _batchItems: SingleBatchItems<Input>;

    /**
     *
     * @summary Reference to the timeout that determins whether the batch should start processing or not
     * @private
     * @type {NodeJS.Timeout}
     * @memberof SingleBatch
     */
    private _waitForNewItemTimeout!: NodeJS.Timeout;

    /**
     *
     * @summary The number of ms to wait for the _waitForNewItemTimeout setTimeout before processing begins
     * @private
     * @type {number}
     * @memberof SingleBatch
     */
    private _waitForNewItemTimeoutValue: number;

    /**
     *
     * @summary A simple boolean value to whether the batch is currently accepting new items
     * @private
     * @type {boolean}
     * @memberof SingleBatch
     */
    private _isAcceptingNewItems: boolean = true;

    /**
     *
     * @summary This is the store of the result promise, that can be awaited and will resolve/reject once the data function is called after timing out
     * @private
     * @type {Promise<PreTransform[]>}
     * @memberof SingleBatch
     */
    private _resultPromise!: Promise<PreTransform[]>;

    /**
     *
     * @summary The maximum size that the batch items array can grow to
     * @private
     * @type {number}
     * @memberof SingleBatch
     */
    private _maximumBatchSize: number;

    /**
     *
     * @summary Reference to the custom provided data function
     * @private
     * @type {IGetDataCallback<Input, PreTransform>}
     * @memberof SingleBatch
     */
    private _dataFunction: IGetDataCallback<Input, PreTransform>;

    /**
     *
     * @summary Globally available resolve function from the result promise construct
     * @private
     * @type {IProcessResponse<PreTransform>}
     * @memberof SingleBatch
     */
    private _processResponse!: IProcessResponse<PreTransform>;

    /**
     *
     * @summary Globally available reject function from the result promise construct
     * @private
     * @type {IProcessFailure}
     * @memberof SingleBatch
     */
    private _processFailure!: IProcessFailure;

    /**
     *
     * @summary A simple number of ms that is the maximum amount of time the data function can take before timing out
     * @private
     * @type {number}
     * @memberof SingleBatch
     */
    private _maxDataFetchTime: number;

    /**
     * Creates an instance of Batch.
     * @param {number} timeout The timeout between pushes before starting the data request
     * @param {IGetDataCallback<Input, PreTransform>} dataFunction The function to call and pass the batched item to
     * @param {number} [maxSize=1000] The maximum allowed batch size
     * @param {number} [maxDataFetchTime=1000] The maximum number of ms allowed before the data function timesout
     * @param {Input[]} [initialItems=[]] The initial items to start the batch with
     * @todo Move parameters to an opts object
     * @todo Move default values to a configuration file
     * @memberof SingleBatch
     */
    constructor(
        timeout: number,
        dataFunction: IGetDataCallback<Input, PreTransform>,
        maxSize: number = 1000,
        maxDataFetchTime: number = 1000,
        initialItems: Input | Input[] = [],
    ) {

        this._validateConstructParameters(dataFunction, maxSize, maxDataFetchTime, timeout);

        this._batchItems = new SingleBatchItems(ConvertToArray(initialItems));
        this._waitForNewItemTimeoutValue = timeout;
        this._dataFunction = dataFunction;
        this._maximumBatchSize = maxSize;
        this._maxDataFetchTime = maxDataFetchTime;

        this._getResultPromise();

    }

    /**
     *
     * @summary Get the items array
     * @description Returns the this._items variable
     * @readonly
     * @type {Input[]}
     * @memberof SingleBatch
     */
    public get items(): Input[] {
        return this._batchItems.values;
    }

    /**
     *
     * @summary Gets the result promise
     * @description Returns the this._resultPromise variable
     * @readonly
     * @type {Promise<PreTransform[]>}
     * @memberof SingleBatch
     */
    public get response(): Promise<PreTransform[]> {
        return this._resultPromise;
    }

    /**
     *
     * @summary Function that takes a simple input that is to be added to the current batch
     * @description This function takes an array of items as a parameter. When called, it clears the timeout, validates the input and then pushes items not already in
     * the batch items array, into the array.
     * @param {Input[]} items Array of items to be pushed into the current batch
     * @returns {Array<IBatchPushError<Input>>} An array that contains all encountered errors, when pushing into batch
     * @memberof SingleBatch
     */
    public pushItemToBatch(items: Input | Input[]): Array<IBatchPushError<Input>> {

        this._resetTimeout();

        items = ConvertToArray(items);

        const { errors, itemsToPush } = this._validatePushParameters([...new Set(items)]);

        this._batchItems.addItems(itemsToPush);

        return errors;

    }

    public checkIfBatchContains(input: Input | Input[], type: ("included" | "excluded") = "included"): Input[] {
        return this._batchItems.checkIfBatchContains(input, type);
    }

    /**
     *
     * @summary Checks the given input array to ensure the batch can handle them
     * @description The given array of items is firstly checked to ensure the general structure is acceptable. The maximum batch size is also checked to ensure this
     * hasn't been breached, or if the batch is currently inflight. If these checks are completed then the array of items is checked on a per item basis. If errors occur
     * at this stage, then the errors array is built up to return with.
     * @throws {Error} If input parameter is not provided
     * @throws {Error} If input parameter is an empty array
     * @throws {Error} If batch length limit has been reached
     * @throws {Error} If batch is not accepting new items
     * @todo Remove initial batch length limit check and run this within the individual checks
     * @private
     * @param {Input[]} items An array of items to push into the batch
     * @returns {IValidatedPushItems<Input>} An object that contains that items that have been pushed with success and items that have errors with the corresponding items
     * @memberof SingleBatch
     */
    private _validatePushParameters(items: Input[]): IValidatedPushItems<Input> {

        const ITEMS_TO_PUSH: Input[] = [];

        if (!items || items.length === 0) throw new Error("Cannot Push Empty Value To Batch");

        if (this._batchItems.length === this._maximumBatchSize) throw new Error("Batch Length Limit Reached");

        if (!this._isAcceptingNewItems) throw new Error("Cannot push items to a request that has already started");

        const ERRORS = items.map((item, index) => {

            let error: string = "";

            if (!["bigint", "string", "number"].includes(typeof item)) error = "Item is not the correct type. Accepted types are `bigint`, `string`, `number`";

            else if (index >= (this._maximumBatchSize - this._batchItems.length) || index > this._maximumBatchSize) error = "Batch maximum size has been reached";

            if (error) {
                return {
                    error,
                    item,
                };
            } else {
                ITEMS_TO_PUSH.push(item);
                return false;
            }

        }).filter((x) => x !== false) as Array<IBatchPushError<Input>>;

        return {
            errors: ERRORS,
            itemsToPush: ITEMS_TO_PUSH,
        };

    }

    /**
     *
     * @summary Simply validate the constructor parameters
     * @description Checks the required input parameters and checks they exist and are of the correct type. If one of these checks fails, the function throws an error.
     * @throws {Error} Data Function must be provided
     * @private
     * @param {IGetDataCallback<Input, PreTransform>} dataFunction The dataFunction to be passed in from the constructor
     * @memberof SingleBatch
     */
    private _validateConstructParameters(dataFunction: IGetDataCallback<Input, PreTransform>, maxSize: number, maxDataFetchTime: number, timeout: number): void {

        if (!dataFunction) throw new Error("Data Function must be provided");

        if (typeof dataFunction !== "function") throw new Error("Data Function must be a function");

        // tslint:disable-next-line:no-magic-numbers
        if (maxSize < 5 || maxSize > 1000) throw new Error("Max size does not fall within allowed range");

        // tslint:disable-next-line:no-magic-numbers
        if (maxDataFetchTime < 500 || maxDataFetchTime > 30000) throw new Error("Max Data Fetch Time does not fall within allowed range");

        // tslint:disable-next-line:no-magic-numbers
        if (timeout < 50 || timeout > 1500) throw new Error("Timeout does not fall within allowed range");

    }

    /**
     *
     * @summary Creates and assigns promise to the class result promise variable
     * @description Creates a new promise that globally assigns the resolve and reject methods, for -calling within the process request function
     * @private
     * @memberof SingleBatch
     */
    private _getResultPromise = (): Promise<PreTransform[]> => this._resultPromise = new Promise((resolve, reject) => {
        this._processResponse = resolve;
        this._processFailure = reject;
    })

    /**
     *
     * @summary Races the data function and a timeout. Responds accordingly.
     * @description Handles the request of the data through the custom data function. On call, the data function and a timeout are called within a race. If the data
     * function completes first, the global resolve function is called. If the timeout completes first, the global reject function is called. The reason for a timeout,
     * is to protect the original request from timing out. The timeout period can be set as a custom parameter.
     * @async
     * @private
     * @memberof SingleBatch
     */
    private _processRequest = async (): Promise<void> => {

        this._isAcceptingNewItems = false;

        let hasTimedOut = false;

        // Race two promises, first is the custom data function, second is the timeout setTimeout
        const RESULT = await Promise.race([
            this._dataFunction(this.items),
            new Promise((resolve) => setTimeout(() => {

                hasTimedOut = true;

                resolve(false);

            }, this._maxDataFetchTime)),
        ]);

        if (!RESULT && hasTimedOut) this._processFailure(new Error("Data Function Timed Out"));

        else if (!Array.isArray(RESULT)) this._processFailure(new Error("Data Function Responded With Bad Data"));

        else this._processResponse(RESULT);

    }

    /**
     * @summary Clears and then recreates the timeout between requests
     * @description Handles the time between recieving the last push item and then processing the data function. This clears the current timeout and then resets it to
     * start again.
     * @private
     * @memberof SingleBatch
     */
    private _resetTimeout(): void {

        clearTimeout(this._waitForNewItemTimeout);

        this._waitForNewItemTimeout = setTimeout(this._processRequest, this._waitForNewItemTimeoutValue);

    }

}
