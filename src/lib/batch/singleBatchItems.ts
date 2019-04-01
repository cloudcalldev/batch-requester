import { ConvertToArray } from "../utils";

export class SingleBatchItems<I> {

    private _items: I[] = [];

    constructor(
        initialItems: I[] = [],
        public maximumLimit: number = 1000,
    ) {
        this.addItems(initialItems);
    }

    public addItems = (items: I[]): I[] => this._items = this._items.concat(this.checkIfBatchContains(items, false));

    public checkIfBatchContains(input: I | I[], showIncludedNotExcluded: boolean = true): I[] {

        input = ConvertToArray(input);

        let results: I[] = [];

        if (showIncludedNotExcluded) results = input.filter((item: I) => this._items.indexOf(item) > -1);

        else results = input.filter((item: I) => this._items.indexOf(item) === -1);

        return results;

    }

    public get spacesRemaining(): number {
        return this.maximumLimit - this._items.length;
    }

    public get limitReached(): boolean {
        return this._items.length === this.maximumLimit;
    }

    public get length(): number {
        return this._items.length;
    }

    public get values(): I[] {
        return this._items;
    }

}
