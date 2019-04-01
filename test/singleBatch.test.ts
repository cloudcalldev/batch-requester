// tslint:disable:no-magic-numbers
// tslint:disable:no-non-null-assertion
// tslint:disable:max-file-line-count

import { SingleBatch } from "../src/lib/batch/singleBatch";

describe("Single Batch", () => {

    describe("Should create ", () => {

        test("A simple instance", () => {

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });

            expect(batch).toBeInstanceOf(SingleBatch);

            expect(batch.items).toBeInstanceOf(Array);

            expect(batch.items).toHaveLength(0);

            expect(batch.response).toBeInstanceOf(Promise);

        });

        test("A simple instance with initial items", () => {

            const batch = new SingleBatch({
                dataFunction: () => [null],
                initialItems: [1, 2, 3],
            });

            expect(batch).toBeInstanceOf(SingleBatch);

            expect(batch.items).toBeInstanceOf(Array);

            expect(batch.items).toHaveLength(3);

            expect(batch.items).toEqual([1, 2, 3]);

            expect(batch.response).toBeInstanceOf(Promise);

        });

        test("A simple instance with a single initial item", () => {

            const batch = new SingleBatch({
                dataFunction: () => [null],
                initialItems: 2,
            });

            expect(batch).toBeInstanceOf(SingleBatch);

            expect(batch.items).toBeInstanceOf(Array);

            expect(batch.items).toHaveLength(1);

            expect(batch.items).toEqual([2]);

            expect(batch.response).toBeInstanceOf(Promise);

        });

    });

    describe("Should throw correct constructor error", () => {

        test("If the Data Function is not provided", () => {
            expect(() => new SingleBatch({
                initialItems: 2,
            } as any)).toThrow(new Error("Data Function must be provided"));
        });

        test("If the Data Function is not a function", () => {
            expect(() => new SingleBatch({
                dataFunction: true,
                initialItems: 2,
            } as any)).toThrow(new Error("Data Function must be a function"));
        });

        test("If the max size is not in range", () => {
            expect(() => new SingleBatch({
                dataFunction: () => [null],
                maxSize: 1,
            })).toThrow(new Error("Max size does not fall within allowed range"));
            expect(() => new SingleBatch({
                dataFunction: () => [null],
                maxSize: 5000,
            })).toThrow(new Error("Max size does not fall within allowed range"));
        });

        test("If the max data fetch time is not in range", () => {
            expect(() => new SingleBatch({
                dataFunction: () => [null],
                maxDataFetchTime: 100,
            })).toThrow(new Error("Max Data Fetch Time does not fall within allowed range"));
            expect(() => new SingleBatch({
                dataFunction: () => [null],
                maxDataFetchTime: 50000,
            })).toThrow(new Error("Max Data Fetch Time does not fall within allowed range"));
        });

        test("If the timeout is not in range", () => {
            expect(() => new SingleBatch({
                dataFunction: () => [null],
                timeout: 1,
            })).toThrow(new Error("Timeout does not fall within allowed range"));
            expect(() => new SingleBatch({
                dataFunction: () => [null],
                timeout: 2000,
            })).toThrow(new Error("Timeout does not fall within allowed range"));
        });

    });

    describe("Should Handle Timers Correctly", () => {

        test("And reset the timeout period when items are pushed", () => {

            jest.useFakeTimers();

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });

            for (let i = 0; i < 100; i++) {
                expect(batch.pushItemToBatch(["item" + i])).toEqual([]);
            }

            expect(setTimeout).toHaveBeenCalledTimes(100);

            jest.useRealTimers();

        });

        test("And not create the promise timer until the first item is pushed", () => {

            jest.useFakeTimers();

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });

            expect(setTimeout).toHaveBeenCalledTimes(0);

            batch.pushItemToBatch(["test1"]);

            expect(setTimeout).toHaveBeenCalledTimes(1);

            jest.useRealTimers();

        });

    });

    describe("Should add items correctly", () => {

        describe("When a single array element is pushed", () => {

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });

            batch.pushItemToBatch(["item1"]);

            test("The pushed item exists in `items` correctly", () => {

                expect(batch.items).toBeInstanceOf(Array);

                expect(batch.items).toHaveLength(1);

                expect(batch.items[0]).toBe("item1");

            });

            test("The `Contains` function returns the correct data with the `included` type", () => {

                expect(batch.checkIfBatchContains(["item1"])).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1"])).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item1"])).toEqual(["item1"]);

                expect(batch.checkIfBatchContains(["item2"])).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item2"])).toHaveLength(0);

                expect(batch.checkIfBatchContains(["item2"])).toEqual([]);

                expect(batch.checkIfBatchContains(["item1", "item2"])).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1", "item2"])).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item1", "item2"])).toEqual(["item1"]);

            });

            test("The `Contains` function returns the correct data with the `excluded` type", () => {

                expect(batch.checkIfBatchContains(["item1"], false)).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1"], false)).toHaveLength(0);

                expect(batch.checkIfBatchContains(["item1"], false)).toEqual([]);

                expect(batch.checkIfBatchContains(["item2"], false)).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item2"], false)).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item2"], false)).toEqual(["item2"]);

                expect(batch.checkIfBatchContains(["item1", "item2"], false)).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1", "item2"], false)).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item1", "item2"], false)).toEqual(["item2"]);

            });

        });

        describe("When a single element is pushed", () => {

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });
            batch.pushItemToBatch("item1");

            test("The pushed item exists in `items` correctly", () => {

                expect(batch.items).toBeInstanceOf(Array);

                expect(batch.items).toHaveLength(1);

                expect(batch.items[0]).toBe("item1");

            });

            test("The `Contains` function returns the correct data if passed a single element", () => {

                expect(batch.checkIfBatchContains("item1")).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains("item1")).toHaveLength(1);

                expect(batch.checkIfBatchContains("item1")).toEqual(["item1"]);

                expect(batch.checkIfBatchContains("item2")).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains("item2")).toHaveLength(0);

                expect(batch.checkIfBatchContains("item2")).toEqual([]);

                expect(batch.checkIfBatchContains(["item1", "item2"])).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1", "item2"])).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item1", "item2"])).toEqual(["item1"]);

            });

            test("The `Contains` function returns the correct data with the `included` type", () => {

                expect(batch.checkIfBatchContains(["item1"])).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1"])).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item1"])).toEqual(["item1"]);

                expect(batch.checkIfBatchContains(["item2"])).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item2"])).toHaveLength(0);

                expect(batch.checkIfBatchContains(["item2"])).toEqual([]);

                expect(batch.checkIfBatchContains(["item1", "item2"])).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1", "item2"])).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item1", "item2"])).toEqual(["item1"]);

            });

            test("The `Contains` function returns the correct data with the `excluded` type", () => {

                expect(batch.checkIfBatchContains(["item1"], false)).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1"], false)).toHaveLength(0);

                expect(batch.checkIfBatchContains(["item1"], false)).toEqual([]);

                expect(batch.checkIfBatchContains(["item2"], false)).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item2"], false)).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item2"], false)).toEqual(["item2"]);

                expect(batch.checkIfBatchContains(["item1", "item2"], false)).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1", "item2"], false)).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item1", "item2"], false)).toEqual(["item2"]);

            });

        });

        describe("When a multiple elements are pushed", () => {

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });

            batch.pushItemToBatch(["item1", "item2", "item3", "item4"]);

            test("The pushed item exists in `items` correctly", () => {

                expect(batch.items).toBeInstanceOf(Array);

                expect(batch.items).toHaveLength(4);

                expect(batch.items).toEqual(["item1", "item2", "item3", "item4"]);

            });

            test("The `Contains` function returns the correct data with `included` as type", () => {

                expect(batch.checkIfBatchContains(["item1"])).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1"])).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item1"])).toEqual(["item1"]);

                expect(batch.checkIfBatchContains(["item5"])).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item5"])).toHaveLength(0);

                expect(batch.checkIfBatchContains(["item5"])).toEqual([]);

                expect(batch.checkIfBatchContains(["item1", "item2", "item5"])).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1", "item2", "item5"])).toHaveLength(2);

                expect(batch.checkIfBatchContains(["item1", "item2", "item5"])).toEqual(["item1", "item2"]);

            });

            test("The `Contains` function returns the correct data with `excluded` as type", () => {

                expect(batch.checkIfBatchContains(["item1"], false)).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1"], false)).toHaveLength(0);

                expect(batch.checkIfBatchContains(["item1"], false)).toEqual([]);

                expect(batch.checkIfBatchContains(["item5"], false)).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item5"], false)).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item5"], false)).toEqual(["item5"]);

                expect(batch.checkIfBatchContains(["item1", "item2", "item5"], false)).toBeInstanceOf(Array);

                expect(batch.checkIfBatchContains(["item1", "item2", "item5"], false)).toHaveLength(1);

                expect(batch.checkIfBatchContains(["item1", "item2", "item5"], false)).toEqual(["item5"]);

            });

        });

        describe("When more than the maximum amount is exceeded", () => {

            test("By using mulitple pushes", () => {

                const maxTestValue = Math.round(Math.random() * 100);

                const batch = new SingleBatch({
                    dataFunction: () => [null],
                    maxSize: maxTestValue,
                });

                for (let i = 1; i <= maxTestValue; i++) {
                    batch.pushItemToBatch(["item" + i]);
                }

                expect(() => batch.pushItemToBatch(["item" + (maxTestValue + 1)])).toThrowError(new Error("Batch Length Limit Reached"));

            });

            test("By using a single push", () => {

                const batch = new SingleBatch({
                    dataFunction: () => [null],
                    maxSize: 10,
                });

                const tmpArray: any[] = [];

                for (let i = 1; i <= 20; i++) {
                    tmpArray.push("item" + i);
                }

                expect(batch.pushItemToBatch(tmpArray)).toEqual([
                    { item: "item11", error: "Batch maximum size has been reached" },
                    { item: "item12", error: "Batch maximum size has been reached" },
                    { item: "item13", error: "Batch maximum size has been reached" },
                    { item: "item14", error: "Batch maximum size has been reached" },
                    { item: "item15", error: "Batch maximum size has been reached" },
                    { item: "item16", error: "Batch maximum size has been reached" },
                    { item: "item17", error: "Batch maximum size has been reached" },
                    { item: "item18", error: "Batch maximum size has been reached" },
                    { item: "item19", error: "Batch maximum size has been reached" },
                    { item: "item20", error: "Batch maximum size has been reached" },
                ]);

                expect(batch.items).toBeInstanceOf(Array);

                expect(batch.items.length).toBe(10);

                expect(batch.items).toEqual(tmpArray.slice(0, 10));

            });

            test("By using a single push and then error", () => {

                const batch = new SingleBatch({
                    dataFunction: () => [null],
                    maxSize: 10,
                });

                const tmpArray: any[] = [];

                for (let i = 1; i <= 20; i++) {
                    tmpArray.push("item" + i);
                }

                expect(batch.pushItemToBatch(tmpArray)).toEqual([
                    { item: "item11", error: "Batch maximum size has been reached" },
                    { item: "item12", error: "Batch maximum size has been reached" },
                    { item: "item13", error: "Batch maximum size has been reached" },
                    { item: "item14", error: "Batch maximum size has been reached" },
                    { item: "item15", error: "Batch maximum size has been reached" },
                    { item: "item16", error: "Batch maximum size has been reached" },
                    { item: "item17", error: "Batch maximum size has been reached" },
                    { item: "item18", error: "Batch maximum size has been reached" },
                    { item: "item19", error: "Batch maximum size has been reached" },
                    { item: "item20", error: "Batch maximum size has been reached" },
                ]);

                expect(batch.items).toBeInstanceOf(Array);

                expect(batch.items.length).toBe(10);

                expect(batch.items).toEqual(tmpArray.slice(0, 10));

                expect(() => batch.pushItemToBatch(["item11"])).toThrowError(Error("Batch Length Limit Reached"));

            });

            test("By using a combination of mulitple and single pushes", () => {

                const batch = new SingleBatch({
                    dataFunction: () => [null],
                    maxSize: 10,
                });

                const tmpArray: any[] = [];

                for (let i = 1; i <= 5 ; i++) {
                    batch.pushItemToBatch(["item" + i]);
                }

                for (let i = 1; i <= 6; i++) {
                    tmpArray.push("itemA" + i);
                }

                expect(batch.pushItemToBatch(tmpArray)).toEqual([
                    { item: "itemA6", error: "Batch maximum size has been reached" },
                ]);

                expect(batch.items).toBeInstanceOf(Array);

                expect(batch.items).toHaveLength(10);

            });

            test("By using a combination of mulitple and single pushes and then recover", () => {

                const batch = new SingleBatch({
                    dataFunction: () => [null],
                    maxSize: 10,
                });

                const tmpArray: any[] = [];

                for (let i = 1; i <= 5 ; i++) {
                    batch.pushItemToBatch(["item" + i]);
                }

                for (let i = 1; i <= 6; i++) {
                    tmpArray.push("itemA" + i);
                }

                expect(batch.pushItemToBatch(tmpArray)).toEqual([
                    { item: "itemA6", error: "Batch maximum size has been reached" },
                ]);

                expect(() => batch.pushItemToBatch(["item6"])).toThrowError(Error("Batch Length Limit Reached"));

                expect(batch.items).toBeInstanceOf(Array);

                expect(batch.items).toHaveLength(10);

            });

        });

    });

    describe("Should handle the maximum batch time correctly", () => {

        test.todo("When a single element is passed");

        test.todo("When multiple elements are passed");

    });

    describe("Should handle when data is pushed after request has started", () => {

        test("as multiple items", async (done) => {

            expect.assertions(1);

            jest.useRealTimers();

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });

            for (let i = 0; i < 10; i++) {
                batch.pushItemToBatch(["item" + i]);
            }

            setTimeout(() => {

                expect(() => batch.pushItemToBatch(["item10", "item11"])).toThrowError(new Error("Cannot push items to a request that has already started"));

                done();

            }, 500);

        });

        test("as a single array", (done) => {

            jest.useRealTimers();

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });

            const tmpBatchA: any[] = [];
            const tmpBatchB: any[] = [];

            for (let i = 0; i < 10; i++) {
                tmpBatchA.push("itemA" + i);
                tmpBatchB.push("itemB" + i);
            }

            batch.pushItemToBatch(tmpBatchA);

            setTimeout(() => {

                expect(() => batch.pushItemToBatch(tmpBatchB)).toThrowError(new Error("Cannot push items to a request that has already started"));

                done();

            }, 500);

        });

    });

    describe("Should handle the response correctly", () => {

        test("When the data function responds with correct data", async () => {

            expect.assertions(1);

            const dataFunction = () => ["newItem1", "newItem2", "newItem3"];

            const batch = new SingleBatch({
                dataFunction,
            });

            batch.pushItemToBatch(["item1", "item2", "item3"]);

            const response = await batch.response;

            expect(response).toEqual(["newItem1", "newItem2", "newItem3"]);

        });

        test.todo("When the data function promise doesnt resovle after a given time period");

        test("When the data function promise doesnt resovle", async () => {

            expect.assertions(1);

            const dataFunction = async (): Promise<boolean[]> => await new Promise((_resolve, _reject) => true);

            const batch = new SingleBatch({
                dataFunction,
                maxDataFetchTime: 1000,
            });

            batch.pushItemToBatch(["item1", "item2", "item3"]);

            await expect(batch.response).rejects.toThrowError(new Error("Data Function Timed Out"));

        });

        test("When the data function responds with bad data", async () => {

            expect.assertions(1);

            const batch = new SingleBatch({
                dataFunction: () => false as any,
            });

            batch.pushItemToBatch(["item1", "item2", "item3"]);

            await expect(batch.response).rejects.toThrowError(new Error("Data Function Responded With Bad Data"));

        });

    });

    describe("Should handle when bad data is pushed", () => {

        test("And no items are pushed", () => {

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });

            expect(() => batch.pushItemToBatch([])).toThrowError(new Error("Cannot Push Empty Value To Batch"));

        });

        test("And duplicate items are pushed in multiple pushes", () => {

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });

            for (let i = 0; i < 10; i++) {
                batch.pushItemToBatch(["item1"]);
            }

            expect(batch.items).toBeInstanceOf(Array);

            expect(batch.items).toHaveLength(1);

            expect(batch.items).toEqual(["item1"]);

        });

        test("And duplicate items are pushed in a single push", () => {

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });

            const arr = [];

            for (let i = 0; i < 10; i++) {
                arr.push("item1");
            }

            batch.pushItemToBatch(arr);

            expect(batch.items).toBeInstanceOf(Array);

            expect(batch.items).toHaveLength(1);

            expect(batch.items).toEqual(["item1"]);

        });

        test("Mixed in with good data", () => {

            const batch = new SingleBatch({
                dataFunction: () => [null],
            });

            const testArr = [];

            for (let i = 0; i < 100; i++) {
                testArr.push("item" + i);
            }

            testArr[50] = false;

            expect(batch.pushItemToBatch(testArr)).toEqual([
                { item: false, error: "Item is not the correct type. Accepted types are `bigint`, `string`, `number`" },
            ]);

        });

    });

});