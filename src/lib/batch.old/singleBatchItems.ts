import { ConvertToArray } from "../utils";

export class SingleBatchItems<Input> {

    private _items: Input[] = [];

    constructor(initialItems: Input[]) {
        this.addItems(initialItems);
    }

    public addItems = (items: Input[]): Input[] => this._items = this._items.concat(this.checkIfBatchContains(items, "excluded"));

    /**
     *
     * @summary A simple function that compares two arrays; an input array and the items array.
     * @description The function accept two parameters, the first is an array of items to check if exists in the current list of items. The second parameter is for the
     * return value format. If set to included, the function will return all items that exist in both arrays. If set to excluded, the function will return with items
     * that are included in the input parameter but not in the items array.
     * @todo Move type to a boolean value, rather than string
     * @param {Input[]} input An array of items to check the batch items against
     * @param {(("included" | "excluded"))} [type="included"] The type of results to be returned. See description for more details
     * @returns {Input[]} An array of items, dependant on the type selected
     * @memberof SingleBatchItems
     */
    public checkIfBatchContains(input: Input | Input[], type: ("included" | "excluded") = "included"): Input[] {

        input = ConvertToArray(input);

        switch (type) {

            // Items that exist in both arrays
            case "included":
                return input.filter((item: Input) => this._items.indexOf(item) > -1);

            // Items that exist in the input array but not in the batch items array
            case "excluded":
                return input.filter((item: Input) => this._items.indexOf(item) === -1);

        }

    }

    public get length(): number {
        return this._items.length;
    }

    public get values(): Input[] {
        return this._items;
    }

}
