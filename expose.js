import deserialize from "./deserialize.js";

export default function expose(obj) {
  addEventListener("message", async evt => {
    const { data } = evt;

    if (typeof data !== "object") return;

    if (!data.jsonrpc === "2.0") return;

    if (!data.method) return;

    const { id, method, params } = evt.data;

    if (method === "microlink.list") {
      return postMessage({
        jsonrpc: "2.0",
        result: Object.keys(obj),
        id
      });
    }

    if (typeof obj[method] !== "function") {
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
      return postMessage({
        jsonrpc: "2.0",
        result,
        id
      });
    } catch (error) {
      console.error(error);
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
