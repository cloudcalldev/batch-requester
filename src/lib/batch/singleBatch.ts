import { IBatchPushError } from "../../domain/IBatchPushError";
import { IResponseHandler } from "../../domain/IResponseHandler";
import { ISingleBatchOptions } from "../../domain/ISingleBatchOptions";
import { IValidatedPushItems } from "../../domain/IValidatedPushItems";
import { ConvertToArray } from "../utils";
import { BatchTimeout } from "./batchTimeout";
import { SingleBatchItems } from "./singleBatchItems";
import { Validate } from "./validate";

export class SingleBatch<I, P, O> {

    private _batchItems: SingleBatchItems<I>;

    private _batchTimeout: BatchTimeout;

    private _isAcceptingNewItems: boolean = true;

    private _hasCompleted: boolean = false;

    private _resultPromise!: Promise<P[]>;

    private _responseHandler!: IResponseHandler<P>;

    constructor(
        private _opts: ISingleBatchOptions<I, P, O>,
    ) {

        this._opts.initialItems = this._opts.initialItems || [];
        this._opts.maxDataFetchTime = this._opts.maxDataFetchTime || Validate.defaults.maxDataFetchTime.value;
        this._opts.maxSize = this._opts.maxSize || Validate.defaults.maxSize.value;
        this._opts.timeout = this._opts.timeout || Validate.defaults.timeout.value;

        Validate.SingleBatchConstructor(_opts);

        this._batchTimeout = new BatchTimeout(this._opts.timeout, this._processRequest);
        this._batchItems = new SingleBatchItems(this._opts.initialItems, this._opts.maxSize);
        this._resultPromise = new Promise((resolve, reject) => this._responseHandler = { resolve, reject });

    }

    public get items(): I[] {
        return this._batchItems.values;
    }

    public get response(): Promise<P[]> {
        return this._resultPromise;
    }

    public pushItemToBatch(items: I | I[]): Array<IBatchPushError<I>> {

        items = ConvertToArray(items);

        const { errors, itemsToPush }: IValidatedPushItems<I> = Validate.SingleBatchPushItems([...new Set(items)], this._batchItems, this._isAcceptingNewItems);

        if (itemsToPush.length > 0) this._batchTimeout.clearAndStartTimer();

        this._batchItems.addItems(itemsToPush);

        return errors;

    }

    public checkIfBatchContains = (input: I | I[], type: boolean = true): I[] => this._hasCompleted ? [] : this._batchItems.checkIfBatchContains(input, type);

    private _processRequest = async (): Promise<void> => {

        this._isAcceptingNewItems = false;

        let hasTimedOut: boolean = false;

        const RESULT = await Promise.race([
            this._opts.dataFunction(this.items),
            new Promise((resolve) => setTimeout(() => {

                hasTimedOut = true;

                console.log("TIMING OUT");
                resolve(false);

            }, this._opts.maxDataFetchTime)),
        ]);

        this._hasCompleted = true;

        if (!RESULT && hasTimedOut) this._responseHandler.reject(new Error("Data Function Timed Out"));

        else if (!Array.isArray(RESULT)) this._responseHandler.reject(new Error("Data Function Responded With Bad Data"));

        else this._responseHandler.resolve(RESULT);

    }

}
