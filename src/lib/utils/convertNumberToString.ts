/**
 * Utilities that are used by the BatchRequester library
 * @module BatchRequester
 * @license MIT
 */


export function ConvertNumberToString(input: string | number): string {

    if (typeof input === "number") input = input.toString();

    return input;

}
