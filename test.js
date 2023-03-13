import test from "flug";
import deserialize from "./deserialize.js";
import serialize from "./serialize.js";

test("deserialize", async ({ eq }) => {
  eq(deserialize({}, [1, 2]), [1, 2]);

  const result1 = deserialize({}, ["microlink.call:hello", 2]);
  eq(typeof result1[0], "function");
  eq(result1.toString(), "params => call(it, method, params),2");

  const result2 = deserialize({}, [{ expr: "microlink.call:expr" }]);
  eq(typeof result2[0].expr, "function");
  eq(result2[0].expr.toString(), "params => call(it, method, params)");
});

test("serialize", async ({ eq }) => {
  eq(serialize([1, 2], "prefix:"), [[1, 2], {}]);
  const params1 = [{ f: () => {} }, 1];
  const [result1, handlers1] = serialize(params1, "prefix:");
  eq(typeof result1[0].f, "string");
  eq(result1[0].f.startsWith("prefix:"), true);
  eq(typeof result1[1], "number");
  eq(Object.keys(handlers1)[0].startsWith("prefix:"), false);
  eq(Object.keys(handlers1).length, 1);
});
