# Batch Requester
![GitHub release](https://img.shields.io/github/release/cloudcalldev/batch-requester.svg?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/cloudcalldev/batch-requester.svg?style=flat-square)
![GitHub](https://img.shields.io/github/license/cloudcalldev/batch-requester.svg?style=flat-square)

A really simple library that just may save you a headache . . . for the time being.

## Who Is This For
Do any of the below sound familiar?

- Noticing multiple duplicate HTTP Requests
- Requests to an endpoint per item, when a batch endpoint could be used
- Mulitple function calls that could also be called with a single array of items
- Other things that you want to together batch

Sometimes, writing good, logical code is - unfortunately - just not an option. Most developers have come across a legacy codebase that just needs rewriting to avoid those 100 duplicate requests ripping apart an API endpoint. As you will know, this is not always an option; whether it's commercial or technical limitations.

Hindsight is always a great thing, especially when it comes to code implementations. If past descisions or misconsiderations are now causing you a headache similar to above and you need a quick, temporary fix. This is what you need.

**Important:** This library is ***not*** a ***permanent solution***. This is a *sticky plaster* that is to get you and your users by.

## Installation
Currently the library can be added via NPM and saved as a dependency. This libary is ***not*** suitable for global installation

```
npm install --save @cloudcall/batch-requester
```

## Usage

### Simple Usage

With simple usage, this library is super easy to hit the ground running with. To get going, you will simply need to do 3 things:

1. Wrap you data function in it's own function
2. Create a mapping function
3. Create a new Batcher instance and call make request


```typescript
import { Batcher } from 'batch-requests';

class TestClass {

    constructor() {
        this.lookupAPI();
    }
    
    private _httpLookup(requestData) {
        return [
            {
                id: 1, 
                name: 'Name 1'
            }, 
            ...
            {
                id: 10,
                name: 'Name 10',
            }
        ]
    }

    private _mappingCallback(requestedData, requestResponse) {
        return requestResponse
            .filter((item) => requestedData.indexOf(item.id) !== -1)
            .map((item) => item.name);
    }

    public lookupAPI() {

        const batch = new Batcher({
            getDataCallback: this._httpLookup,
            mappingCallback: this._mappingCallback
        });

        for (let i = 0; i < 10; i++) {
            batch.makeRequest(i).then((response) => {

                console.log('Index ' + i + ' = ' + response);

                // Index 1 = Name 1
                // ...
                // Index 10 = Name 10

            });
        }

    }

}
```

## License (MIT)
See the LICENSE file for details
