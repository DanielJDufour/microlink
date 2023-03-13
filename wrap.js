import call from "./call.js";

export default async function wrap(worker) {
  const obj = {};

  const methods = await call(worker, "microlink.list");

  methods.forEach(method => {
    obj[method] = (...params) => call(worker, method, params);
  });

  return obj;
}
