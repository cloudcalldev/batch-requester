import { ConvertNumberToString } from "../utils";

type Key = any;

export class CacheBucket {

    private _items: { [index: string]: {
        value: any,
        timeout?: any,
    }};

    constructor(
        private _expiry?: number,
    ) {
        this._items = {};
    }

    public setItem<T>(key: Key, value: T, expiry?: number): void {

        key = ConvertNumberToString(key);

        this._clearItemExpiry(key);

        this._items[key] = { value };

        const expiryVal = expiry || this._expiry;

        if (expiryVal) this._items[key].timeout = setTimeout(this._expireItem.bind(null, key), expiryVal);

    }

    public getItem<T>(key: Key): T | undefined {

        if (typeof key === "number") key = key.toString();

        return this._items[key] ? this._items[key].value : undefined;

    }

    private _clearItemExpiry(key: string) {
        if (this._items[key] && this._items[key].timeout) clearTimeout(this._items[key].timeout);
    }

    private _expireItem = (key: string) => {
        delete this._items[key];
    }

}
