// tslint:disable:no-magic-numbers

import { FlattenArray } from "../src/lib/utils";

describe("Utils function", () => {

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

});
