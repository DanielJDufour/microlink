import deserialize from "./deserialize.js";

export default function expose(obj, options) {
  let batch_size = options && typeof options.batch_size === "number" ? options.batch_size : 1;
  let batch_wait = options && typeof options.batch_wait === "number" ? options.batch_wait : Infinity; // 10ms
  const debug_level = options && options.debug_level;

  const onmessage = async evt => {
    let { data } = evt;

    if (debug_level >= 2) console.log("[microlink.expose] received message data", data);

    if (typeof data !== "object") return;

    if (!data.jsonrpc === "2.0") return;

    if (!data.method) return;

    const { id, method, params } = evt.data;

    if (method === "microlink.list") {
      if (debug_level >= 2) console.log("[microlink.expose] posting method names", data);
      return postMessage({
        jsonrpc: "2.0",
        result: Object.keys(obj),
        id
      });
    }

    if (typeof obj[method] !== "function") {
      if (debug_level >= 2) console.error("[microlink.expose] method not found: " + method);
      return postMessage({
        jsonrpc: "2.0",
        error: {
          code: -32601,
          message: "Method not found"
        },
        id
      });
    }

    try {
      // batching applies to messsages posted up
      const deserialized_params = deserialize(self, params, 2, { batch_size, batch_wait });
      const result = await obj[method](...deserialized_params);
      if (debug_level >= 2) console.log("[microlink.expose] posting result for " + method + ": " + JSON.stringify(result));
      return postMessage({
        jsonrpc: "2.0",
        result,
        id
      });
    } catch (error) {
      if (debug_level >= 2) console.error("[microlink.expose] error:", error);
      return postMessage({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error"
        },
        id
      });
    }
  };

  // unblock main thread of worker
  addEventListener("message", evt => {
    setTimeout(() => onmessage(evt), 0);
  });
}
