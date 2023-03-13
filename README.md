# microlink
> Comlink Alternative

## features
- easily pass function to another thread
- built with [JSON-RPC 2.0](https://www.jsonrpc.org/specification)
- zero run-time dependencies

## usage
#### inside worker.js
```js
import { expose } from 'microlink';

expose({
  run: (func, args) => func(...args),
  halve: n => n / 2,
});
```

#### inside main.js
```js
import { wrap } from 'microlink';
// or, import wrap from 'microlink/wrap';

const worker = new Worker("worker.js");
const obj = await wrap(worker);

await obj.halve(10);
5

const count_elements = selector => document.querySelectorAll(selector).length;
await obj.run(count_elements, 'div');
```