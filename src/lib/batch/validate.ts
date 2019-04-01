import { IBatchPushError } from "../../domain/IBatchPushError";
import { IBatchRequesterOptions } from "../../domain/IBatchRequesterOptions";
import { IValidatedPushItems } from "../../domain/IValidatedPushItems";
import { SingleBatchItems } from "./singleBatchItems";

export class Validate {

    public static defaults = {
        dataFunction: {
            errors: {
                incorrectType: "Data Function must be a function",
                notProvided: "Data Function must be provided",
            },
        },
        mappingCallback: {
            errors: {
                incorrectType: "Mapping Callback must be a function",
                notProvided: "Mapping Callback must be provided",
            },
        },
        maxDataFetchTime: {
            errors: {
                notProvided: "Max Data Fetch Time must be provided",
                range: "Max Data Fetch Time does not fall within allowed range",
            },
            maximum: 30000,
            minimum: 500,
            value: 15000,
        },
        maxSize: {
            errors: {
                notProvided: "Max size must be provided",
                range: "Max size does not fall within allowed range",
            },
            maximum: 1000,
            minimum: 5,
            value: 1000,
        },
        options: {
            errors: {
                notProvided: "Options parameter is required",
            },
        },
        timeout: {
            errors: {
                notProvided: "Timeout must be provided",
                range: "Timeout does not fall within allowed range",
            },
            maximum: 1500,
            minimum: 50,
            value: 250,
        },
    };

    public static SingleBatchConstructor<I, P, O>(opts: IBatchRequesterOptions<I, P, O>): void {

        const { dataFunction, maxSize, maxDataFetchTime, timeout, options } = Validate.defaults;

        if (!opts) throw new Error(options.errors.notProvided);

        if (!opts.dataFunction) throw new Error(dataFunction.errors.notProvided);

        if (typeof opts.dataFunction !== "function") throw new Error(dataFunction.errors.incorrectType);

        if (!opts.maxSize) throw new Error(maxSize.errors.notProvided);

        if (opts.maxSize < maxSize.minimum || opts.maxSize > maxSize.maximum) throw new Error(maxSize.errors.range);

        if (!opts.maxDataFetchTime) throw new Error(maxDataFetchTime.errors.notProvided);

        if (opts.maxDataFetchTime < maxDataFetchTime.minimum || opts.maxDataFetchTime > maxDataFetchTime.maximum) throw new Error(maxDataFetchTime.errors.range);

        if (!opts.timeout) throw new Error(timeout.errors.notProvided);

        if (opts.timeout < timeout.minimum || opts.timeout > timeout.maximum) throw new Error(timeout.errors.range);

    }

    public static AutoBatcherConstructor<I, P, O>(opts: IBatchRequesterOptions<I, P, O>): void {

        const { dataFunction, options, mappingCallback } = Validate.defaults;

        if (!opts) throw new Error(options.errors.notProvided);

        if (!opts.dataFunction) throw new Error(dataFunction.errors.notProvided);

        if (typeof opts.dataFunction !== "function") throw new Error(dataFunction.errors.incorrectType);

        if (!opts.mappingCallback) throw new Error(mappingCallback.errors.notProvided);

        if (typeof opts.mappingCallback !== "function") throw new Error(mappingCallback.errors.incorrectType);

    }

    public static AutoBatcherMakeRequest<I>(input: I[]): void {
        if (input === undefined || input.length === 0 ) throw new Error("No input data provided");
    }

    public static SingleBatchPushItems<I>(items: I[], batchItems: SingleBatchItems<I>, isAcceptingNewItems: boolean): IValidatedPushItems<I> {

        const itemsToPush: I[] = [];

        if (!items || items.length === 0) throw new Error("Cannot Push Empty Value To Batch");

        if (batchItems.limitReached) throw new Error("Batch Length Limit Reached");

        if (!isAcceptingNewItems) throw new Error("Cannot push items to a request that has already started");

        const errors = items.map((item, index) => {

            let error: string = "";

            if (!["bigint", "string", "number"].includes(typeof item)) error = "Item is not the correct type. Accepted types are `bigint`, `string`, `number`";

            else if (index >= batchItems.spacesRemaining) error = "Batch maximum size has been reached";

            if (error) return { error, item };

            else {
                itemsToPush.push(item);
                return false;
            }

        }).filter((x) => x !== false) as Array<IBatchPushError<I>>;

        return { errors, itemsToPush };

    }

}
