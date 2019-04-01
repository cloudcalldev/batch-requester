import { AutoBatcher } from "./autoBatcher";

export class BatcherSingleton {

    private static _instance: BatcherSingleton;

    public requests: {[key: string]: AutoBatcher<any, any, any>} = {};

    public addRequest<I, P, O>(name: string, autoBatcher: AutoBatcher<I, P, O>): AutoBatcher<I, P, O> {

        if (!this.requests[name]) {
            this.requests[name] = autoBatcher;
        }

        return this.requests[name];

    }

    public static get Instance(): BatcherSingleton {
        return this._instance || (this._instance = new this());
    }

}
