/**
 * Utilities that are used by the BatchRequester library
 * @module BatchRequester
 * @license MIT
 */

/**
 *
 * @summary Takes an input item and if its not an array, transforms it an array
 * @export
 * @template T
 * @param {(T | T[])} input
 * @returns {T[]}
 */
export function ConvertToArray<T>(input: T | T[]): T[] {

    if (!Array.isArray(input) && input !== undefined) input = [input];

    return input;

}
