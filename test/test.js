import test from "flug";
import MockWorker from "mock-worker";

import call from "../esm/call.js";
import batch from "../cjs/batch.js";
import batchcall from "../esm/batchcall.js";
import deserialize from "../esm/deserialize.js";
import serialize from "../esm/serialize.js";

import chunk from "./utils/chunk.js";
import sleep from "./utils/sleep.js";

const sortRandomly = arr => arr.sort(() => Math.random() - Math.random());

test("batch", async ({ eq }) => {
  let count = 0;
  let results = [];
  const action = values => {
    results = results.concat(values);
    return values.map(n => n / 10);
  };
  const wait = 10;
  const run = batch(action, { size: 10, wait });
  const p1 = run(1);
  eq(count, 0);
  const p2 = run(2);
  await sleep(1);
  eq(count, 0);
  const p3 = run(3);
  eq(results.length, 0);
  await sleep(wait + 1);
  eq(results.length, 3);
  eq(results, [1, 2, 3]);
  const p4 = await run(4);
  eq(p4, 0.4);
  await sleep(50);
  eq(await p1, 0.1);
  eq(await p2, 0.2);
  eq(await p3, 0.3);
  eq(await p4, 0.4);
});

test("chunk", ({ eq }) => {
  eq(chunk([1, 2, 3], 1), [[1], [2], [3]]);
  eq(chunk([1, 2, 3], 2), [[1, 2], [3]]);
  eq(chunk([1, 2, 3], 3), [[1, 2, 3]]);
});

test("deserialize", async ({ eq }) => {
  eq(deserialize({}, [1, 2]), [1, 2]);

  const result1 = deserialize({}, ["microlink.function:hello", 2]);
  eq(Array.isArray(result1), true);
  eq(typeof result1[0], "function");
  eq(
    result1.map(it => it.toString()),
    ["function () {\n      const params = Array.from(arguments);\n      return runInBatch({ method, params });\n    }", "2"]
  );

  let listener;
  let posted = null;
  const tracker = {
    addEventListener: (type, it) => (listener = it),
    postMessage: message => (posted = message),
    removeEventListener: () => {}
  };
  const batch_size = 3;
  const batch_wait = 100;
  const result2 = deserialize(tracker, [{ expr: "microlink.function:expr" }], 0, { batch_size, batch_wait });
  eq(typeof result2[0].expr, "function");
  eq(result2[0].expr.toString(), "function () {\n      const params = Array.from(arguments);\n      return runInBatch({ method, params });\n    }");
  const p1 = result2[0].expr([123]);
  const p2 = result2[0].expr([456]);
  const p3 = result2[0].expr([789]);
  await sleep(200);
  const results = posted.map(({ jsonrpc, method, params, id }) => ({ jsonrpc, id, result: params[0][0] * 10 }));
  const actual = posted.map(({ jsonrpc, method, params }) => ({ jsonrpc, method, params }));
  eq(actual, [
    { jsonrpc: "2.0", method: "expr", params: [[123]] },
    { jsonrpc: "2.0", method: "expr", params: [[456]] },
    { jsonrpc: "2.0", method: "expr", params: [[789]] }
  ]);

  // post results
  listener({ data: results });

  await sleep(5);
  eq(await p1, 1230);
  eq(await p2, 4560);
  eq(await p3, 7890);
  eq(await Promise.all([p1, p2, p3]), [1230, 4560, 7890]);
});

test("serialize", async ({ eq }) => {
  const f = () => {};
  eq(
    serialize([1, 2], {}, () => "FID"),
    [[1, 2], {}, {}]
  );
  eq(
    serialize([{ f }, 1], { function_prefix: "prefix:" }, () => "FID"),
    [[{ f: "prefix:FID" }, 1], { FID: f }, {}]
  );
});

test("serialize top-level promise", async ({ eq }) => {
  const p = Promise.resolve(42);
  const [serialized, params] = serialize(p, { promise_prefix: "p:" }, () => "ID");
  eq(serialized, "p:ID");
  eq(typeof params.ID, "function");
  eq(typeof params.ID().then, "function");
  eq(await params.ID(), 42);
});

test("serialize nested promise", async ({ eq }) => {
  const p = Promise.resolve(42);
  const results = serialize([{ p }], { promise_prefix: "p:" }, () => "ID");
  eq(results.length, 3);
  const [serialized, funcs] = results;
  eq(serialized, [{ p: "p:ID" }]);
  eq(await funcs.ID(), 42);
});

test("call", async ({ eq }) => {
  const onload = ({ self }) => {
    self.onmessage = evt => {
      if (evt.data.method !== "max") throw Error("uh oh");
      self.postMessage({
        jsonrpc: "2.0",
        id: evt.data.id,
        result: Math.max(...evt.data.params)
      });
    };
  };
  const worker = MockWorker({ onload });
  const callPromise = call(worker, "max", [-1, 1], { debug_level: 0 });
  eq(worker.__handlers__.message.length, 1);
  const result = await callPromise;
  eq(result, 1);
  eq(worker.__handlers__.message.length, 0);
});

test("batch call", async ({ eq }) => {
  const onload = ({ self }) => {
    self.onmessage = evt => {
      if (!evt.data.every(req => req.method === "max")) throw Error("uh oh");

      const results = evt.data.map(req => ({
        jsonrpc: "2.0",
        id: req.id,
        result: Math.max(...req.params)
      }));

      // according to jsonrpc, results don't
      // have to be in order
      sortRandomly(results);

      self.postMessage(results);
    };
  };
  const worker = MockWorker({ onload });
  const reqs = [
    { method: "max", params: [-99, 99] },
    { method: "max", params: [4, -4] },
    { method: "max", params: [5, -5] },
    { method: "max", params: [-1, 1] },
    { method: "max", params: [-10, 10] }
  ];
  const callPromise = batchcall(worker, reqs, { debug_level: 0 });
  eq(worker.__handlers__.message.length, 1);
  const result = await callPromise;
  eq(result, [99, 4, 5, 1, 10]);
  eq(worker.__handlers__.message.length, 0);

  // sending just a batch size of 1
  eq(await batchcall(worker, [reqs[0]]), [99]);
});
