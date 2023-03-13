import call from "./call.js";

export default function deserialize(it, inpt, depth = 1) {
  if (Array.isArray(inpt)) {
    if (depth >= 0) {
      return inpt.map(param => deserialize(it, param, depth - 1));
    } else {
      return inpt;
    }
  } else if (typeof inpt === "object") {
    const obj = {};
    for (let key in inpt) {
      obj[key] = deserialize(it, inpt[key], depth - 1);
    }
    return obj;
  } else if (typeof inpt === "string" && inpt.startsWith("microlink.call:")) {
    const method = inpt.replace(/^microlink.call:/, "");
    return params => call(it, method, params);
  } else {
    return inpt;
  }
}
