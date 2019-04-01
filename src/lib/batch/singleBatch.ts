import { IBatchPushError, IBatchRequesterOptions } from "../../domain/batchRequesterOptions";
import { ConvertToArray } from "../utils";
import { BatchTimeout } from "./batchTimeout";
import { SingleBatchItems } from "./singleBatchItems";
import { Validate } from "./validate";

interface IResponseHandler<P> {
    resolve: (value?: P[] | PromiseLike<P[]> | undefined) => void;
    reject: (reason?: any) => void;
}

export class SingleBatch<I, P, O> {

    private _batchItems: SingleBatchItems<I>;

    private _batchTimeout: BatchTimeout;

    private _isAcceptingNewItems: boolean = true;

    private _resultPromise!: Promise<P[]>;

    private _responseHandler!: IResponseHandler<P>;

    constructor(
        private _opts: IBatchRequesterOptions<I, P, O>,
    ) {

        Validate.SingleBatchConstructor(_opts);

        this._batchTimeout = new BatchTimeout(this._opts.timeout, this._processRequest);
        this._batchItems = new SingleBatchItems(ConvertToArray(this._opts.initialItems));
        this._resultPromise = new Promise((resolve, reject) => this._responseHandler = { resolve, reject });

    }

    public get items(): I[] {
        return this._batchItems.values;
    }

    public get response(): Promise<P[]> {
        return this._resultPromise;
    }

    public pushItemToBatch(items: I | I[]): Array<IBatchPushError<I>> {

        this._batchTimeout.clearAndStartTimer();

        items = ConvertToArray(items);

        const { errors, itemsToPush }: any = Validate.SingleBatchPushItems([...new Set(items)], this._batchItems, this._isAcceptingNewItems);

        this._batchItems.addItems(itemsToPush);

        return errors;

    }

    public checkIfBatchContains = (input: I | I[], type: boolean = true): I[] => this._batchItems.checkIfBatchContains(input, type);

    private _processRequest = async (): Promise<void> => {

        this._isAcceptingNewItems = false;

        let hasTimedOut: boolean = false;

        const RESULT: any = await Promise.race([
            this._opts.dataFunction(this.items),
            new Promise((resolve) => setTimeout(() => {

                hasTimedOut = true;

                resolve(false);

            }, this._opts.maxDataFetchTime)),
        ]);

        if (!RESULT && hasTimedOut) this._responseHandler.reject(new Error("Data Function Timed Out"));

        else if (!Array.isArray(RESULT)) this._responseHandler.reject(new Error("Data Function Responded With Bad Data"));

        else this._responseHandler.resolve(RESULT);

    }

}
