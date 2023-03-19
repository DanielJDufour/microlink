import serialize from "./serialize.js";

export default function call(it, method, params, { debug_level = 0 } = {}) {
  if (!params) params = [];

  let [params_serialized, params_functions] = serialize(params, "microlink.call:");
  if (debug_level >= 2) {
    console.log("[Microlink.call] serialized to ", [params_serialized, params_functions]);
  }

  return new Promise(resolve => {
    const id = Math.random();
    it.addEventListener("message", async function ({ data }) {
      if (typeof data !== "object") return;
      if (data.jsonrpc !== "2.0") return;

      if (data.method && params_functions && data.method in params_functions) {
        const result = await params_functions[data.method](...data.params);
        const msg = { jsonrpc: "2.0", result, id: data.id };
        if (debug_level >= 2) console.log("[Microlink.call] top thread posting message", msg);
        return it.postMessage(msg);
      }

      if (data.id === id) {
        it.removeEventListener("message", this);

        // enable garbage collection of params
        // even if promise is used later
        params_functions = null;

        return resolve(data.result);
      }
    });

    const msg = { jsonrpc: "2.0", id, method, params: params_serialized };
    if (debug_level >= 2) console.log("[Microlink.call] top thread posting message", msg);
    return it.postMessage(msg);
  });
}
