import { Cache } from "./cache";

const test = Cache.Instance;

const testBucket = test.addBucket('test');

testBucket.setItem("item1", "sdfsdfs", 1000);

console.log(testBucket.getItem("item1"));

setTimeout(() => {
    console.log(testBucket.getItem("item1"));
}, 2500);