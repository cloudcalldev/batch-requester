import { AutoBatcher } from "./autoBatcher";
import { AutoBatcherCache } from "./autoBatcherCache";

export { SingleBatch } from "./singleBatch";
export { BatcherSingleton } from "./batcherSingleton";

function BatchRequesterFactory<Input, PreTransform, Output>(options: any): AutoBatcher<Input, PreTransform, Output> {

    if (options.cache) {
        return new AutoBatcherCache<Input, PreTransform, Output>(options);
    } else {
        return new AutoBatcher<Input, PreTransform, Output>(options);
    }

}

const test = BatchRequesterFactory({});