# acdcache
[async-cache-dedupe](https://github.com/mcollina/async-cache-dedupe) made easier in TS

## Install

```sh
npm i acdcache
``` 

## Usage

Create your functions fetching remote data and add cache logic:

```ts
// example: src/repository/bankAccount.ts
const getBankAccount = async (bank_account_id: string) => {
    const result = await fetch(bank_account_id); // this would be some remote call by ID
    return result;
};
export const definitions = [
    def("getBankAccount", getBankAccount, (_args, _key, result) => [result.id]), // will save as the ID in cache reference
];
```

Create your cache instance:

```ts
// example: src/cache.ts
import { createCache } from "acdcache";
import { definitions } from "./repository/bankAccount";

export const cache = createCache({
    ttl: 60 * 60 * 1000, // 1 hour
}, definitions); // first parameter are standard async-cache-dedupe options

cache.getBankAccount("1234").then((result) => {
    console.log(result);
}); // enjoy dynamic, typesafe cache methods
```


