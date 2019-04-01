import { CacheBucket } from "./cacheBucket";

export class Cache {

    private static _instance: Cache;

    private _buckets: { [key: string]: CacheBucket };

    constructor() {
        this._buckets = {};
    }

    public addBucket(name: string): CacheBucket {

        const newBucket = new CacheBucket();

        this._buckets[name] = newBucket;

        return newBucket;

    }

    public getBucket = (name: string): CacheBucket => this._buckets[name] || this.addBucket(name);

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

}
