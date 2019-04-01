import { IAutoBatcherOptions } from "../../domain";
import { IBatchesContainItems } from "../../domain/IBatchesContainItems";
import { SingleBatch } from "./singleBatch";

export class Batches<I, P, O> {

    protected _batches: Array<SingleBatch<I, P, O>> = [];

    constructor(
        protected _opts: IAutoBatcherOptions<I, P, O>,
    ) {}

    protected _checkIfLatestBatchContains(input: I[]): Array<IBatchesContainItems<I, P, O>> {

        const BATCHES: Array<IBatchesContainItems<I, P, O>> = [];

        this._batches.forEach((batch: SingleBatch<I, P, O>) => batch.checkIfBatchContains(input).forEach((elem: I) => BATCHES.push({
            batch: batch.response,
            item: elem,
        })));

        return BATCHES;

    }

    protected _createNewBatch(): SingleBatch<I, P, O> {

        const NEW_BATCH = new SingleBatch<I, P, O>(this._opts);

        this._batches.push(NEW_BATCH);

        return NEW_BATCH;

    }

    protected get _latestBatch(): SingleBatch<I, P, O> {

        const LENGTH: number = this._batches.length;

        return LENGTH > 0 ? this._batches[LENGTH - 1] : this._createNewBatch();

    }

}
