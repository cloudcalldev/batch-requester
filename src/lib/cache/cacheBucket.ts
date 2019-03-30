type Key = string | number;

export class CacheBucket {

    private _items: { [index: string]: {
        value: any,
        timeout: number,
    }};

    constructor(
        public expiry?: number,
    ) {
        this._items = {};
    }

    public setItem<T>(key: Key, value: T, expiry?: number): void {

        key = this._transformKeyValue(key);

        this._clearItemExpiry(key);

        this._items[key].value = value;

        const expiryVal = expiry || this.expiry;

        if (expiryVal) {
            this._items[key].timeout = window.setTimeout(this._expireItem.bind(null, key), expiryVal);
        }

    }

    public getItem<T>(key: Key): T {

        if (typeof key === "number") key = key.toString();

        return this._items[key].value;

    }

    private _transformKeyValue(key: Key): string {

        if (typeof key === "number") key = key.toString();

        return key;

    }

    private _clearItemExpiry(key: string) {
        if (this._items[key].timeout) clearTimeout(this._items[key].timeout);
    }

    private _expireItem = (key: string) => delete this._items[key];

}
