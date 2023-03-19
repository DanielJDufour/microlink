import call from "./call.js";

export default async function wrap(worker, { debug_level = 0 } = {}) {
  const obj = {};

  const methods = await call(worker, "microlink.list", undefined, {
    debug_level
  });
  if (debug_level >= 2) console.log("[Microlink.wrap] methods:", methods);

  methods.forEach(method => {
    obj[method] = (...params) => {
      if (debug_level >= 2) console.log("[Microlink.wrap] called worker." + method);
      return call(worker, method, params, { debug_level });
    };
  });

  return obj;
}
