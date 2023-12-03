import expose from "http://localhost:8080/esm/expose.js";
// import wrap from "http://localhost:8080/esm/wrap.js";

expose(
  {
    run: func => func(),
    math: (name, arg1, arg2) => Math[name](arg1, arg2),
    pow: (base, exp) => {
      if (exp === undefined) throw Error("exp is undefined");
      return Math.pow(base, exp);
    },
    send_promise: () => {
      return { promise: Promise.resolve(42) };
    },
    u8: () => {
      return Promise.resolve({
        data: [Uint8Array.from([1, 2, 3, 4]), Uint16Array.from([5, 6, 7, 8])]
      });
    }
  },
  { debug_level: 10 }
);
