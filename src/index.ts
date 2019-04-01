import { BatchRequester } from "./lib/batch/createBatchRequester";
import { CacheBucket } from "./lib/cache/cacheBucket";
// tslint:disable:no-magic-numbers
console.log("NOW");
const testCache = new CacheBucket(5000);

const test = BatchRequester({
    cache: testCache,
    dataFunction: (_x) => {
        console.log("Data");
        return [1, 2, 3, 4, 5];
    },
    mappingCallback: (x) => [{
        item: x[0],
        value: x.toString(),
    }],
});

for (let i = 0; i < 10; i++) {
    test.makeRequest(i).then((resp: any) => console.log(i, resp));
}

setTimeout(() => {
    for (let i = 0; i < 10; i++) {
        test.makeRequest(i).then((resp: any) => console.log(i, resp));
    }
}, 2500);

setTimeout(() => {
    for (let i = 0; i < 10; i++) {
        test.makeRequest(i).then((resp: any) => console.log(i, resp));
    }
}, 7500);
