/**
 * BatcherContainer Class that is used for the BatchRequester library
 * @module BatchRequester
 * @license MIT
 */

import { AutoBatcher } from "./autoBatcher";

/**
 *
 * @since 0.0.1
 * @export
 * @class BatcherContainer
 */
export class BatcherSingleton {

    /**
     *
     * @summary Singleton Instance of container
     * @private
     * @static
     * @type {BatcherSingleton}
     * @memberof BatcherContainer
     */
    private static _instance: BatcherSingleton;

    /**
     *
     * @summary The object that holds all of the request containers
     * @type {{[key: string]: AutoBatcher<any, any, any>}}
     * @memberof BatcherContainer
     */
    public requests: {[key: string]: AutoBatcher<any, any, any>} = {};

    /**
     *
     * @summary Adds a new request container to the singleton instance
     * @param {string} name Accessor name of the request container
     * @param {AutoBatcher<any, any, any>} batcher Batcher to be passed through
     * @returns {AutoBatcher<any, any, any>} Newly created batcher
     * @memberof BatcherContainer
     */
    public addRequest(name: string, batcher: AutoBatcher<any, any, any>): AutoBatcher<any, any, any> {

        if (!this.requests[name]) {
            this.requests[name] = batcher;
        }

        return this.requests[name];

    }

    /**
     *
     * @summary Creates instance if it doesnt exist and then returns the singleton instance
     * @readonly
     * @static
     * @memberof BatcherContainer
     */
    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

}
