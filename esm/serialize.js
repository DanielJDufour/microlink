/**
 * @name serialize
 * @description convert functions at any level of nesting to strings
 * @param {any} it
 * @param {String} prefix - add to beginning of function ids
 * @returns [it, funcs]
 */
export default function serialize(things, prefix = "func:") {
  const funcs = {};

  function stringify(it) {
    if (Array.isArray(it)) {
      return it.map(i => stringify(i));
    } else if (typeof it === "object") {
      return Object.fromEntries(Object.entries(it).map(([k, v]) => [k, stringify(v)]));
    } else if (typeof it === "function") {
      const fid = Math.random();
      funcs[fid] = it;
      return prefix + fid;
    } else {
      return it;
    }
  }

  things = stringify(things);

  return [things, funcs];
}
