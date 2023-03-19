import deserialize from "./deserialize.js";

export default function expose(obj, options) {
  const debug_level = options && options.debug_level;

  addEventListener("message", async evt => {
    const { data } = evt;
    if (debug_level >= 2) console.log("[Microlink.expose] received message data", data);

    if (typeof data !== "object") return;

    if (!data.jsonrpc === "2.0") return;

    if (!data.method) return;

    const { id, method, params } = evt.data;

    if (method === "microlink.list") {
      if (debug_level >= 2) console.log("[Microlink.expose] posting method names", data);
      return postMessage({
        jsonrpc: "2.0",
        result: Object.keys(obj),
        id
      });
    }

    if (typeof obj[method] !== "function") {
      if (debug_level >= 2) console.error("[Microlink.expose] method not found: " + method);
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
      const deserialized_params = deserialize(self, params, 2);
      const result = await obj[method](...deserialized_params);
      if (debug_level >= 2) console.log("[Microlink.expose] posting result for " + method + ": " + JSON.stringify(result));
      return postMessage({
        jsonrpc: "2.0",
        result,
        id
      });
    } catch (error) {
      if (debug_level >= 2) console.error("[Microlink.expose] error:", error);
      return postMessage({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error"
        },
        id
      });
    }
  });
}
