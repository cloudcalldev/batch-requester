// tslint:disable:no-magic-numbers
// tslint:disable:no-string-literal

import Batch from "../src/lib/batch";
import Batcher from "../src/lib/batcher";

describe("Request Container", () => {

    test("Should create a basic instance", () => {

        const container = new Batcher({
            getDataCallback: () => [null],
            mappingCallback: () => [null],
        });

        expect(container).toBeInstanceOf(Batcher);

        expect(container["_latestBatch"]).toBe(false);

    });

    describe("Should throw the correct constructor error", () => {

        test("If the data callback is not provided", () => {

            expect(() => new Batcher({
                mappingCallback: () => [null],
            } as any)).toThrowError(Error("Data Callback is required"));

        });

        test("If the data callback is not a function", () => {

            expect(() => new Batcher({
                getDataCallback: ["test"],
                mappingCallback: () => [null],
            } as any)).toThrowError(Error("Data Callback must be a function"));

        });

        test("If the mapping callback is not provided", () => {

            expect(() => new Batcher({
                getDataCallback: () => [null],
            } as any)).toThrowError(Error("Mapping Callback is required"));

        });

        test("If the mapping callback is not a function", () => {

            expect(() => new Batcher({
                getDataCallback: () => [null],
                mappingCallback: ["test"],
            } as any)).toThrowError(Error("Mapping Callback must be a function"));

        });

        test("If no options are provided", () => {
            expect(() => new Batcher(false as any)).toThrowError(Error("Options parameter is required"));
        });

    });

    describe("Should make a single request", () => {

        test("With a single element array", async () => {

            expect.assertions(2);

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (x) => x,
            });

            await expect(container.makeRequest([1])).resolves.toEqual([1]);
            expect((container["_latestBatch"] as Batch<any, any>).items).toEqual([1]);

        });

        test("With a single element", async (done) => {

            expect.assertions(1);

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (x) => x,
            });

            expect(container.makeRequest(1)).resolves.toEqual([1]).then(done);

        });

        test("With a single element and transform correctly", async (done) => {

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (_x) => ["a"],
            });

            expect(container.makeRequest(1)).resolves.toEqual(["a"]).then(done);

        });

        test("With mulitple item array", async (done) => {

            expect.assertions(1);

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (x) => x,
            });

            expect(container.makeRequest([1, 2, 3, 4, 5, 6])).resolves.toEqual([1, 2, 3, 4, 5, 6]).then(done);

        });

        test("With mulitple item array and transform correctly", async (done) => {

            expect.assertions(1);

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (_x) => ["a"],
            });

            expect(container.makeRequest([1, 2, 3, 4, 5, 6])).resolves.toEqual(["a"]).then(done);

        });

        test("With multiple single elements simultaneously", async (done) => {

            expect.assertions(25);

            jest.useRealTimers();

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (x) => x,
            });

            let responded = 0;

            for (let i = 0; i < 25; i++) {
                container.makeRequest(i).then((x) => {

                    expect(x).toEqual([i]);

                    if (++responded === 25) {
                        done();
                    }

                });
            }

            jest.useFakeTimers();

        });

        test("With multiple single elements simultaneously and map correctly", async (done) => {

            expect.assertions(25);

            jest.useRealTimers();

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (x) => ["a" + x],
            });

            let responded = 0;

            for (let i = 0; i < 25; i++) {
                container.makeRequest(i).then((x) => {

                    expect(x).toEqual(["a" + i]);

                    if (++responded === 25) {
                        done();
                    }

                });
            }

            jest.useFakeTimers();

        });

        test("With no data", () => {

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (x) => x,
            });

            expect(container.makeRequest(undefined as any)).rejects.toThrowError(Error("No input data provided"));

            expect(container.makeRequest([])).rejects.toThrowError(Error("No input data provided"));

        });

        test("With bad data", () => {

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (x) => x,
            });

            expect(container.makeRequest(false)).rejects.toThrowError(Error("Input data must be string, number or bigint"));

        });

        test("With a mulitple item array with a length greater than the default maximum batch amount", async (done) => {

            jest.useRealTimers();

            expect.assertions(3);

            let mappingCallbackTimes = 0;
            let dataCallbackTimes = 0;

            const container = new Batcher({
                getDataCallback: (x) => {
                    dataCallbackTimes++;
                    return x;
                },
                mappingCallback: (x) => {
                    mappingCallbackTimes++;
                    return x;
                },
            });

            const testArr = [];

            for (let i = 0; i < 1500; i++) {
                testArr.push("test" + i);
            }

            const test = await container.makeRequest(testArr);

            expect(test).toEqual(testArr);

            expect(mappingCallbackTimes).toBe(1);
            expect(dataCallbackTimes).toBe(2);

            done();

            jest.useFakeTimers();

        });

        test.todo("With a multiple item array with a length greater than a specified maximum batch amount");

    });

    describe("Should handle the latest batch being requested", () => {

        test("Successfully", () => {

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (x) => x,
            });

            const testArr = [];

            for (let i = 0; i < 10; i++) {
                testArr.push("item" + i);
            }

            container.makeRequest(testArr);

            const batch = (container["_latestBatch"] as Batch<any, any>);

            expect(batch.items).toEqual(testArr);

        });

        test("When there is no latest batch",  () => {

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (x) => x,
            });

            const batch = (container["_latestBatch"] as Batch<any, any>);

            expect(batch).toBe(false);

        });

    });

    describe("Should handle new batches being created", () => {

        test("And correctly return the newly created batch", () => {

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (x) => x,
            });

            expect(container["_latestBatch"]).toEqual(false);

            const batch = container["_createNewBatch"]();

            expect(batch).toBeInstanceOf(Batch);
            expect(container["_latestBatch"]).toBeInstanceOf(Batch);

            expect(batch.items).toBeInstanceOf(Array);
            expect((container["_latestBatch"] as Batch<any, any>).items).toBeInstanceOf(Array);

            expect(batch.items).toHaveLength(0);
            expect((container["_latestBatch"] as Batch<any, any>).items).toHaveLength(0);

            expect(batch.items).toEqual([]);
            expect((container["_latestBatch"] as Batch<any, any>).items).toEqual([]);

            batch.pushItemToBatch(["1"]);

            expect(batch.items).toEqual(["1"]);
            expect((container["_latestBatch"] as Batch<any, any>).items).toEqual(["1"]);

        });

        test("When existing batches already exist", () => {

            const container = new Batcher({
                getDataCallback: (x) => x,
                mappingCallback: (x) => x,
            });

            expect(container["_latestBatch"]).toEqual(false);

            for (let i = 0; i < 10; i++) {
                container.makeRequest(["item" + i]);
            }

            expect((container["_latestBatch"] as Batch<any, any>)).toBeInstanceOf(Batch);

            expect((container["_latestBatch"] as Batch<any, any>).items).toBeInstanceOf(Array);

            expect((container["_latestBatch"] as Batch<any, any>).items).toHaveLength(10);

            const batch = container["_createNewBatch"]();

            expect(batch).toBeInstanceOf(Batch);
            expect(container["_latestBatch"]).toBeInstanceOf(Batch);

            expect(batch.items).toBeInstanceOf(Array);
            expect((container["_latestBatch"] as Batch<any, any>).items).toBeInstanceOf(Array);

            expect(batch.items).toHaveLength(0);
            expect((container["_latestBatch"] as Batch<any, any>).items).toHaveLength(0);

            expect(batch.items).toEqual([]);
            expect((container["_latestBatch"] as Batch<any, any>).items).toEqual([]);

            batch.pushItemToBatch(["1"]);

            expect(batch.items).toEqual(["1"]);
            expect((container["_latestBatch"] as Batch<any, any>).items).toEqual(["1"]);

        });

    });

    describe("Should make mulitple requests", () => {

        describe("And handle small batch sizes succesfully", () => {

            describe("With duplicates", () => {

                test("Individually", async (done) => {

                    jest.useRealTimers();

                    const dataSet = require("./dataSet.test.json");
                    const ids: any[] = [];

                    dataSet.map((item: any) => item._id).forEach((id: string) => {

                        ids.push(id);

                        if (Math.round(Math.random() * 10) <= 5) {
                            ids.unshift(id);
                        }

                    });

                    expect.assertions(ids.length * 4);

                    const container = new Batcher<any, any, any>({
                        getDataCallback: (x: any[]) => new Promise((resolve) => setTimeout(() => resolve(dataSet.filter((item: any) => x.includes(item._id))), 500)),
                        mappingCallback: (x, y) => y.filter((item) => x.includes(item._id)).map((item) => ({
                            id: item._id,
                            value: item.isActive ? item.tags[0] : false,
                        })),
                        maxBatchSize: 10,
                    });

                    let responseCount = 0;

                    ids.forEach((item: string) => {

                        container.makeRequest(item).then((x) => {

                            const dataSetItem = dataSet.filter((dataItem: any) => dataItem._id === item)[0];

                            expect(x).toBeInstanceOf(Array);
                            expect(x).toHaveLength(1);
                            expect(item).toBe(x[0].id);
                            expect(x[0].value).toEqual(dataSetItem.isActive ? dataSetItem.tags[0] : false);

                            if (++responseCount === ids.length) {
                                done();
                                jest.useFakeTimers();
                            }

                        });

                    });

                });

                test("As bulk", async (done) => {

                    jest.useRealTimers();

                    const dataSet = require("./dataSet.test.json");
                    const ids: any[] = [];

                    dataSet.map((item: any) => item._id).forEach((id: string) => {

                        ids.push(id);

                        if (Math.round(Math.random() * 10) <= 5) {
                            ids.unshift(id);
                        }

                    });

                    expect.assertions(202);

                    const container = new Batcher<any, any, any>({
                        getDataCallback: (x: any[]) => new Promise((resolve) => setTimeout(() => resolve(x.map((id) => dataSet.find((d: any) => d._id === id))), 500)),
                        mappingCallback: (x, y) => y.filter((item) => x.includes(item._id)).map((item) => ({
                            id: item._id,
                            value: item.isActive ? item.tags[0] : false,
                        })),
                        maxBatchSize: 10,
                    });

                    container.makeRequest(ids).then((response) => {

                        expect(response).toBeInstanceOf(Array);
                        expect(response).toHaveLength(100);

                        response.forEach((item) => {

                            const foundItem = dataSet.find((dataItem: any) => dataItem._id === item.id);

                            expect(foundItem).toBeInstanceOf(Object);
                            expect(item.value).toBe(foundItem.isActive ? foundItem.tags[0] : false);

                        });

                        done();

                        jest.useFakeTimers();

                    });

                });

            });

            test("Individually", async (done) => {

                jest.useRealTimers();

                const dataSet = require("./dataSet.test.json");
                const ids = dataSet.map((item: any) => item._id);

                expect.assertions(400);

                const container = new Batcher<any, any, any>({
                    getDataCallback: (x: any[]) => new Promise((resolve) => setTimeout(() => resolve(dataSet.filter((item: any) => x.includes(item._id))), 500)),
                    mappingCallback: (x, y) => y.filter((item) => x.includes(item._id)).map((item) => ({
                        id: item._id,
                        value: item.isActive ? item.tags[0] : false,
                    })),
                    maxBatchSize: 10,
                });

                let responseCount = 0;

                ids.forEach((item: string) => {

                    container.makeRequest(item).then((x) => {

                        const dataSetItem = dataSet.filter((dataItem: any) => dataItem._id === item)[0];

                        expect(x).toBeInstanceOf(Array);
                        expect(x).toHaveLength(1);
                        expect(item).toBe(x[0].id);
                        expect(x[0].value).toEqual(dataSetItem.isActive ? dataSetItem.tags[0] : false);

                        if (++responseCount === ids.length) {
                            done();
                            jest.useFakeTimers();
                        }

                    });

                });

            });

            test("As bulk", async (done) => {

                jest.useRealTimers();

                const dataSet = require("./dataSet.test.json");
                const ids = dataSet.map((item: any) => item._id);

                expect.assertions(202);

                const container = new Batcher<any, any, any>({
                    getDataCallback: (x: any[]) => new Promise((resolve) => setTimeout(() => resolve(dataSet.filter((item: any) => x.includes(item._id))), 500)),
                    mappingCallback: (x, y) => y.filter((item) => x.includes(item._id)).map((item) => ({
                        id: item._id,
                        value: item.isActive ? item.tags[0] : false,
                    })),
                    maxBatchSize: 10,
                });

                container.makeRequest(ids).then((response) => {

                    expect(response).toBeInstanceOf(Array);
                    expect(response).toHaveLength(100);

                    response.forEach((item) => {

                        const foundItem = dataSet.find((dataItem: any) => dataItem._id === item.id);

                        expect(foundItem).toBeInstanceOf(Object);
                        expect(item.value).toBe(foundItem.isActive ? foundItem.tags[0] : false);

                    });

                    done();

                    jest.useFakeTimers();

                });

            });

        });

        describe("And request succesfully", () => {

            test("Individually", async (done) => {

                jest.useRealTimers();

                const dataSet = require("./dataSet.test.json");
                const ids = dataSet.map((item: any) => item._id);

                expect.assertions(400);

                const container = new Batcher<any, any, any>({
                    getDataCallback: (x: any[]) => new Promise((resolve) => setTimeout(() => resolve(dataSet.filter((item: any) => x.includes(item._id))), 500)),
                    mappingCallback: (x, y) => y.filter((item) => x.includes(item._id)).map((item) => ({
                        id: item._id,
                        value: item.isActive ? item.tags[0] : false,
                    })),
                });

                let responseCount = 0;

                ids.forEach((item: string) => {

                    container.makeRequest(item).then((x) => {

                        const dataSetItem = dataSet.filter((dataItem: any) => dataItem._id === item)[0];

                        expect(x).toBeInstanceOf(Array);
                        expect(x).toHaveLength(1);
                        expect(item).toBe(x[0].id);
                        expect(x[0].value).toEqual(dataSetItem.isActive ? dataSetItem.tags[0] : false);

                        if (++responseCount === ids.length) {
                            done();
                            jest.useFakeTimers();
                        }

                    });

                });

            });

            test("As bulk", async (done) => {

                jest.useRealTimers();

                const dataSet = require("./dataSet.test.json");
                const ids = dataSet.map((item: any) => item._id);

                expect.assertions(202);

                const container = new Batcher<any, any, any>({
                    getDataCallback: (x: any[]) => new Promise((resolve) => setTimeout(() => resolve(dataSet.filter((item: any) => x.includes(item._id))), 500)),
                    mappingCallback: (x, y) => y.filter((item) => x.includes(item._id)).map((item) => ({
                        id: item._id,
                        value: item.isActive ? item.tags[0] : false,
                    })),
                });

                container.makeRequest(ids).then((response) => {

                    expect(response).toBeInstanceOf(Array);
                    expect(response).toHaveLength(100);

                    response.forEach((item) => {

                        const foundItem = dataSet.find((dataItem: any) => dataItem._id === item.id);

                        expect(foundItem).toBeInstanceOf(Object);
                        expect(item.value).toBe(foundItem.isActive ? foundItem.tags[0] : false);

                    });

                    done();

                    jest.useFakeTimers();

                });

            });

        });

        describe("And handle duplicates correctly", () => {

            test("If all items are duplicates", async (done) => {

                jest.useRealTimers();

                const dataSet = require("./dataSet.test.json");
                const ids = dataSet.map((item: any) => item._id)[0];

                const idArr = [];

                for (let i = 0; i < 100; i++) {
                    idArr.push(ids);
                }

                expect.assertions(4);

                const container = new Batcher<any, any, any>({
                    getDataCallback: (x: any[]) => new Promise((resolve) => setTimeout(() => resolve(dataSet.filter((item: any) => x.includes(item._id))), 500)),
                    mappingCallback: (x, y) => y.filter((item) => x.includes(item._id)).map((item) => ({
                        id: item._id,
                        value: item.isActive ? item.tags[0] : false,
                    })),
                    maxBatchSize: 10,
                });

                container.makeRequest(idArr).then((response) => {

                    expect(response).toBeInstanceOf(Array);
                    expect(response).toHaveLength(1);

                    response.forEach((item) => {

                        const foundItem = dataSet.find((dataItem: any) => dataItem._id === item.id);

                        expect(foundItem).toBeInstanceOf(Object);
                        expect(item.value).toBe(foundItem.isActive ? foundItem.tags[0] : false);

                    });

                    done();

                    jest.useFakeTimers();

                });

            });

            test("Individually", async (done) => {

                jest.useRealTimers();

                const dataSet = require("./dataSet.test.json");
                const ids: any[] = [];

                dataSet.map((item: any) => item._id).forEach((id: string) => {

                    ids.push(id);

                    if (Math.round(Math.random() * 10) <= 5) {
                        ids.unshift(id);
                    }

                });

                expect.assertions(ids.length * 4);

                const container = new Batcher<any, any, any>({
                    getDataCallback: (x: any[]) => new Promise((resolve) => setTimeout(() => resolve(dataSet.filter((item: any) => x.includes(item._id))), 500)),
                    mappingCallback: (x, y) => y.filter((item) => x.includes(item._id)).map((item) => ({
                        id: item._id,
                        value: item.isActive ? item.tags[0] : false,
                    })),
                });

                let responseCount = 0;

                ids.forEach((item: string) => {

                    container.makeRequest(item).then((x) => {

                        const dataSetItem = dataSet.filter((dataItem: any) => dataItem._id === item)[0];

                        expect(x).toBeInstanceOf(Array);
                        expect(x).toHaveLength(1);
                        expect(item).toBe(x[0].id);
                        expect(x[0].value).toEqual(dataSetItem.isActive ? dataSetItem.tags[0] : false);

                        if (++responseCount === ids.length) {
                            done();
                            jest.useFakeTimers();
                        }

                    });

                });

            });

            test("As bulk", async (done) => {

                jest.useRealTimers();

                const dataSet = require("./dataSet.test.json");
                const ids: any[] = [];

                dataSet.map((item: any) => item._id).forEach((id: string) => {

                    ids.push(id);

                    if (Math.round(Math.random() * 10) <= 5) {
                        ids.unshift(id);
                    }

                });

                expect.assertions(202);

                const container = new Batcher<any, any, any>({
                    getDataCallback: (x: any[]) => new Promise((resolve) => setTimeout(() => resolve(dataSet.filter((item: any) => x.includes(item._id))), 500)),
                    mappingCallback: (x, y) => y.filter((item) => x.includes(item._id)).map((item) => ({
                        id: item._id,
                        value: item.isActive ? item.tags[0] : false,
                    })),
                });

                container.makeRequest(ids).then((response) => {

                    expect(response).toBeInstanceOf(Array);
                    expect(response).toHaveLength(100);

                    response.forEach((item) => {

                        const foundItem = dataSet.find((dataItem: any) => dataItem._id === item.id);

                        expect(foundItem).toBeInstanceOf(Object);
                        expect(item.value).toBe(foundItem.isActive ? foundItem.tags[0] : false);

                    });

                    done();

                    jest.useFakeTimers();

                });

            });

        });

    });

});
