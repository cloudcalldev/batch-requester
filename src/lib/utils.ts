/**
 * Utilities that are used by the BatchRequester library
 * @module BatchRequester
 * @license MIT
 */

/**
 *
 * @summary Flatten Array of arrays by 1 depth
 * @export
 * @template T
 * @param {T[][]} input
 * @returns {T[]}
 */
export function FlattenArray<T>(input: T[][]): T[] {

    let output: T[] = [];

    if (!input || !Array.isArray(input)) return output;

    input.forEach((item: T[]) => output = output.concat(item));

    return output;

}

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
