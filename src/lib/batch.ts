/**
 * Single Batch Class that is used for the BatchRequester library
 * @module BatchRequester
 * @license MIT
 */

import { IBatchPushError, IGetDataCallback, IProcessFailure, IProcessResponse, IValidatedPushItems } from "../domain";

/**
 * @since 0.0.1
 * @internal
 * @export
 * @class Batch
 * @template Input The input type of items that is going to be pushed into the batch
 * @template PreTransform The type of data that the data function responds with
 */
export default class Batch<Input, PreTransform> {

    /**
     *
     * @summary The final array of items that will be passed to the data function
     * @private
     * @todo Update to be Set rather than Array
     * @type {Input[]}
     * @memberof Batch
     */
    private _items: Input[];

    /**
     *
     * @summary Reference to the timeout that determins whether the batch should start processing or not
     * @private
     * @type {NodeJS.Timeout}
     * @memberof Batch
     */
    private _waitTimeout!: NodeJS.Timeout;

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
     * @summary A simple boolean value to whether the batch is currently accepting new items
     * @private
     * @type {boolean}
     * @memberof Batch
     */
    private _acceptingNewItems: boolean;

    /**
     *
     * @summary This is the store of the result promise, that can be awaited and will resolve/reject once the data function is called after timing out
     * @private
     * @type {Promise<PreTransform[]>}
     * @memberof Batch
     */
    private _resultPromise!: Promise<PreTransform[]>;

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
     * @summary Reference to the custom provided data function
     * @private
     * @type {IGetDataCallback<Input, PreTransform>}
     * @memberof Batch
     */
    private _dataFunction: IGetDataCallback<Input, PreTransform>;

    /**
     *
     * @summary Globally available resolve function from the result promise construct
     * @private
     * @type {IProcessResponse<PreTransform>}
     * @memberof Batch
     */
    private _processResponse!: IProcessResponse<PreTransform>;

    /**
     *
     * @summary Globally available reject function from the result promise construct
     * @private
     * @type {IProcessFailure}
     * @memberof Batch
     */
    private _processFailure!: IProcessFailure;

    /**
     *
     * @summary A simple number of ms that is the maximum amount of time the data function can take before timing out
     * @private
     * @type {number}
     * @memberof Batch
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
     * @todo Allow initialItems to be a single item
     * @todo Set a minimum/maximum value that can be passed to maxSize
     * @todo Set a minimum/maximum value that can be passed to maxDataFetchTime
     * @todo Set a minimum/maximum value that can be passed to timeout
     * @memberof Batch
     */
    constructor(
        timeout: number,
        dataFunction: IGetDataCallback<Input, PreTransform>,
        maxSize: number = 1000,
        maxDataFetchTime: number = 1000,
        initialItems: Input[] = [],
    ) {

        this._validateConstructParameters(dataFunction);

        this._items = initialItems;
        this._delayBetweenRequests = timeout;
        this._acceptingNewItems = true;
        this._dataFunction = dataFunction;
        this._maxSize = maxSize;
        this._maxDataFetchTime = maxDataFetchTime;

        this._getResultPromise();

    }

    /**
     *
     * @summary Get the items array
     * @description Returns the this._items variable
     * @readonly
     * @type {Input[]}
     * @memberof Batch
     */
    public get items(): Input[] {
        return this._items;
    }

    /**
     *
     * @summary Gets the result promise
     * @description Returns the this._resultPromise variable
     * @readonly
     * @type {Promise<PreTransform[]>}
     * @memberof Batch
     */
    public get response(): Promise<PreTransform[]> {
        return this._resultPromise;
    }

    public get acceptingNewItems(): boolean {
        return this._acceptingNewItems;
    }

    /**
     *
     * @summary Function that takes a simple input that is to be added to the current batch
     * @description This function takes an array of items as a parameter. When called, it clears the timeout, validates the input and then pushes items not already in
     * the batch items array, into the array.
     * @todo Allow input parameter to be a single item
     * @param {Input[]} items Array of items to be pushed into the current batch
     * @returns {Array<IBatchPushError<Input>>} An array that contains all encountered errors, when pushing into batch
     * @memberof Batch
     */
    public pushItemToBatch(items: Input[]): Array<IBatchPushError<Input>> {

        this._resetTimeout();

        const { errors, itemsToPush } = this._validatePushParameters([...new Set(items)]);

        // Set the batch items to be: Current Batch Items + New Batch Items that do not already Exist
        this._items = this._items.concat(this.checkIfBatchContains(itemsToPush, "excluded"));

        return errors;

    }

    /**
     *
     * @summary A simple function that compares two arrays; an input array and the items array.
     * @description The function accept two parameters, the first is an array of items to check if exists in the current list of items. The second parameter is for the
     * return value format. If set to included, the function will return all items that exist in both arrays. If set to excluded, the function will return with items
     * that are included in the input parameter but not in the items array.
     * @todo Allow input parameter to be a single item
     * @todo Move type to a boolean value, rather than string
     * @param {Input[]} input An array of items to check the batch items against
     * @param {(("included" | "excluded"))} [type="included"] The type of results to be returned. See description for more details
     * @returns {Input[]} An array of items, dependant on the type selected
     * @memberof Batch
     */
    public checkIfBatchContains(input: Input[], type: ("included" | "excluded") = "included"): Input[] {

        switch (type) {

            // Items that exist in both arrays
            case "included":
                return input.filter((item: Input) => this.items.indexOf(item) > -1);

            // Items that exist in the input array but not in the batch items array
            case "excluded":
                return input.filter((item: Input) => this.items.indexOf(item) === -1);

        }

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
     * @todo Allow items parameter to be single element
     * @todo Remove initial batch length limit check and run this within the individual checks
     * @private
     * @param {Input[]} items An array of items to push into the batch
     * @returns {IValidatedPushItems<Input>} An object that contains that items that have been pushed with success and items that have errors with the corresponding items
     * @memberof Batch
     */
    private _validatePushParameters(items: Input[]): IValidatedPushItems<Input> {

        const ITEMS_TO_PUSH: Input[] = [];

        if (!items || items.length === 0) throw new Error("Cannot Push Empty Value To Batch");

        if (this._items.length === this._maxSize) throw new Error("Batch Length Limit Reached");

        if (!this._acceptingNewItems) throw new Error("Cannot push items to a request that has already started");

        const ERRORS = items.map((item, index) => {

            let error: string = "";

            if (!["bigint", "string", "number"].includes(typeof item)) error = "Item is not the correct type. Accepted types are `bigint`, `string`, `number`";

            else if (index >= (this._maxSize - this._items.length) || index > this._maxSize) error = "Batch maximum size has been reached";

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
     * @todo Add in check for dataFunction type
     * @private
     * @param {IGetDataCallback<Input, PreTransform>} dataFunction The dataFunction to be passed in from the constructor
     * @memberof Batch
     */
    private _validateConstructParameters(dataFunction: IGetDataCallback<Input, PreTransform>): void {
        if (!dataFunction) throw new Error("Data Function must be provided");
    }

    /**
     *
     * @summary Creates and assigns promise to the class result promise variable
     * @description Creates a new promise that globally assigns the resolve and reject methods, for -calling within the process request function
     * @private
     * @memberof Batch
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
     * @memberof Batch
     */
    private _processRequest = async (): Promise<void> => {

        this._acceptingNewItems = false;

        setTimeout(() => {
            this._processFailure(new Error("Data Function Timed Out"));
        }, this._maxDataFetchTime);

        try {
            const res = await this._dataFunction(this.items);
            this._processResponse(res);
        } catch (e) {
            this._processFailure(e);
        }
    };

    /**
     * @summary Clears and then recreates the timeout between requests
     * @description Handles the time between recieving the last push item and then processing the data function. This clears the current timeout and then resets it to
     * start again.
     * @private
     * @memberof Batch
     */
    private _resetTimeout(): void {

        clearTimeout(this._waitTimeout);

        this._waitTimeout = setTimeout(this._processRequest, this._delayBetweenRequests);

    }

}
