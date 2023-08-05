import serialize from "./serialize.js";

export default function call(it, method, params, { debug_level = 0 } = {}) {
  if (!params) params = [];

  let [params_serialized, params_functions] = serialize(params, "microlink.call:");
  if (debug_level >= 2) {
    console.log("[microlink.call] serialized to ", [params_serialized, params_functions]);
  }

  return new Promise(resolve => {
    const id = Math.random();
    const listener = async function listener(evt) {
      if (debug_level >= 2) {
        console.log("[microlink.call] response listener received message event with data", evt.data);
      }
      let { data } = evt;

      if (typeof data !== "object" || data === null) return;

      // batch request
      if (Array.isArray(data) && data.length >= 1 && data[0].jsonrpc === "2.0" && data[0].method) {
        if (debug_level >= 2) console.log("[microlink.call] top thread received batch request");
        if (!params_functions) throw new Error("[microlink.call] no callable functions");
        // const times = []
        let results = await Promise.all(
          data.map(async req => {
            // if (!req.method) throw new Error("[Microlink.call] missing method");
            // if (!(req.method in params_functions)) throw new Error("[Microlink.call] invalid method");
            const result = await params_functions[req.method](...req.params);
            return { jsonrpc: "2.0", result, id: req.id };
          })
        );
        if (debug_level >= 2) console.log("[microlink.call] top thread posting results to worker:", results);
        return it.postMessage(results);
      }

      if (data.jsonrpc !== "2.0") return;

      if (data.method && params_functions && data.method in params_functions) {
        if (!Array.isArray(data.params)) throw Error("[microlink.call] params should be an array");
        const result = await params_functions[data.method](...data.params);
        const msg = { jsonrpc: "2.0", result, id: data.id };
        if (debug_level >= 2) console.log("[microlink.call] posting message down to worker:", msg);
        return it.postMessage(msg);
      }

      if (data.id === id) {
        it.removeEventListener("message", listener);

        // enable garbage collection of params
        // even if promise is used later
        params_functions = null;

        resolve(data.result);
      }
    };
    it.addEventListener("message", listener);

    const msg = { jsonrpc: "2.0", id, method, params: params_serialized };
    if (debug_level >= 3) console.log("[microlink.call] posting message down to worker:", msg);
    return it.postMessage(msg);
  });
}
