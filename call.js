import serialize from "./serialize.js";

export default function call(it, method, params) {
  if (!params) params = [];

  let [params_serialized, params_functions] = serialize(
    params,
    "microlink.call:"
  );

  return new Promise(resolve => {
    const id = Math.random();
    it.addEventListener("message", async function ({ data }) {
      if (typeof data !== "object") return;
      if (data.jsonrpc !== "2.0") return;

      if (data.method && params_functions && data.method in params_functions) {
        const result = await params_functions[data.method](...data.params);
        it.postMessage({ jsonrpc: "2.0", result, id: data.id });
      }

      if (data.id === id) {
        it.removeEventListener("message", this);

        // enable garbage collection of params
        // even if promise is used later
        params_functions = null;

        resolve(data.result);
      }
    });

    it.postMessage({ jsonrpc: "2.0", id, method, params: params_serialized });
  });
}
