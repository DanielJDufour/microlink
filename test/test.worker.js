import expose from "http://localhost:8080/esm/expose.js";
import wrap from "http://localhost:8080/esm/wrap.js";

expose(
  {
    run: func => func(),
    math: (name, arg1, arg2) => Math[name](arg1, arg2),
    pow: (base, exp) => {
      if (exp === undefined) throw Error("exp is undefined");
      return Math.pow(base, exp);
    }
  },
  { debug_level: 0 }
);
