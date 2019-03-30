/**
 * BatcherContainer Class that is used for the BatchRequester library
 * @module BatchRequester
 * @license MIT
 */

import { Batcher } from "./batcher";

/**
 *
 * @since 0.0.1
 * @export
 * @class BatcherContainer
 */
export class BatcherContainer {

    /**
     *
     * @summary Singleton Instance of container
     * @private
     * @static
     * @type {BatcherContainer}
     * @memberof BatcherContainer
     */
    private static _instance: BatcherContainer;

    /**
     *
     * @summary The object that holds all of the request containers
     * @type {{[key: string]: Batcher<any, any, any>}}
     * @memberof BatcherContainer
     */
    public requests: {[key: string]: Batcher<any, any, any>} = {};

    /**
     *
     * @summary Adds a new request container to the singleton instance
     * @param {string} name Accessor name of the request container
     * @param {Batcher<any, any, any>} batcher Batcher to be passed through
     * @returns {Batcher<any, any, any>} Newly created batcher
     * @memberof BatcherContainer
     */
    public addRequest(name: string, batcher: Batcher<any, any, any>): Batcher<any, any, any> {

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
