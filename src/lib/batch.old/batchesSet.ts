import { SingleBatch } from ".";
import { IBatchRequestsOptions } from "../../domain";

export class BatchesSet<Input, PreTransform, Output> {

    /**
     *
     * @summary The number of ms to wait for the _waitTimeout setTimeout before processing begins
     * @private
     * @type {number}
     * @memberof BatchesSetesSet
     */
    private _delayBetweenRequests: number;

    /**
     *
     * @summary The maximum size that the batch items array can grow to
     * @private
     * @type {number}
     * @memberof BatchesSet
     */
    private _maxSize: number;

    /**
     *
     * @summary A simple number of ms that is the maximum amount of time the data function can take before timing out
     * @private
     * @type {number}
     * @memberof BatchesSet
     */
    private _maxDataFetchTime: number;

    /**
     *
     * @summary Array of batches
     * @todo Move array to be set/weakSet
     * @private
     * @type {Array<SingleBatch<Input, PreTransform>>}
     * @memberof BatchesSeter
     */
    protected _batches: Array<SingleBatch<Input, PreTransform>> = [];

    constructor(
        protected _opts: IBatchRequestsOptions<Input, PreTransform, Output>,
    ) {

        const DELAY_BETWEEN_REQUESTS = 100;
        const MAX_SIZE = 1000;
        const MAX_TIME = 5000;

        this._delayBetweenRequests = this._opts.delay || DELAY_BETWEEN_REQUESTS;
        this._maxSize = this._opts.maxBatchSize || MAX_SIZE;
        this._maxDataFetchTime = this._opts.maxTime || MAX_TIME;

    }

    /**
     *
     * @summary Creates a batch and updates latest batch
     * @description Function simply creates a new batch based on the constructor arguments and then pushes it into the batches array ready for use. Once
     * this is completed, the newly created batch is then returned.
     * @todo Move the Batch type to be injected into the constructor
     * @private
     * @returns {SingleBatch<Input, PreTransform>} The newly created batch
     * @memberof BatchesSeter
     */
    protected _createNewBatch(): SingleBatch<Input, PreTransform> {

        const NEW_BATCH = new SingleBatch(this._delayBetweenRequests, this._opts.getDataCallback, this._maxSize, this._maxDataFetchTime);

        this._batches.push(NEW_BATCH);

        return NEW_BATCH;

    }

    /**
     *
     * @summary Returns the latest batch
     * @description Gets the last item index in the batches array and then returns the said index item
     * @readonly
     * @private
     * @type {(SingleBatch<Input, PreTransform> | boolean)}
     * @memberof BatchesSeter
     */
    protected get _latestBatch(): SingleBatch<Input, PreTransform> | boolean {

        const LENGTH = this._batches.length;

        return LENGTH > 0 ? this._batches[LENGTH - 1] : false;

    }

}
