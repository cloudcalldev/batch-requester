// tslint:disable:no-magic-numbers

import { ConvertNumberToString, ConvertToArray, FlattenArray } from "../src/lib/utils";

describe("Utils function", () => {

    describe ("ConvertNumberToString shoudl handle data", () => {

        test("successfully", () => {
            expect(ConvertNumberToString(1)).toEqual("1");
            expect(ConvertNumberToString("1")).toEqual("1");
        });

        test("When no data is passed in", () => {
            expect(ConvertNumberToString(undefined as any)).toEqual(undefined);
        });

        test("When bad data is passed in", () => {
            expect(ConvertNumberToString(false as any)).toEqual(false);
        });

    });

    describe("FlattenArray should handle data", () => {

        test("successfully", () => {
            expect(FlattenArray([[1, 2, 3], [4, 5, 6]])).toEqual([1, 2, 3, 4, 5, 6]);
        });

        test("When no data is passed in", () => {
            expect(FlattenArray(undefined as any)).toEqual([]);
        });

        test("When bad data is passed in", () => {
            expect(FlattenArray(false as any)).toEqual([]);
        });

    });

    describe("ConvertArray should handle data", () => {

        test("Succssfully", () => {

            expect(ConvertToArray(1)).toEqual([1]);

            expect(ConvertToArray([1])).toEqual([1]);

            expect(ConvertToArray(true)).toEqual([true]);

            expect(ConvertToArray(["one", true, 3])).toEqual(["one", true, 3]);

        });

        test("When no data is passed in", () => {
            expect(ConvertToArray(undefined)).toEqual(undefined);
        });

    });

});
