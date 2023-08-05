import expose from "./expose.js";
import wrap from "./wrap.js";

if (typeof window === "object") {
  window.microlink = { expose, wrap };
}

if (typeof self === "object") {
  self.microlink = { expose, wrap };
}

if (typeof module === "object") {
  module.exports = { expose, wrap };
}

if (typeof define === "function" && define.amd) {
  define(function () {
    return { expose, wrap };
  });
}
