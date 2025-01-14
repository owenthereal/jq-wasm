const jq = require("../src/index.js");

describe("json() error", () => {
  [
    {
      j: { foo: "bar", biz: 5 },
      q: "[.foo, .biz] | ",
      e: "jq: error: syntax error, unexpected end of file (Unix shell quoting issues?) at <top-level>, line 1:\n[.foo, .biz] |               \njq: 1 compile error",
    },
    {
      j: { foo: 1 },
      q: ".foo | .[]",
      e: "jq: error (at /dev/stdin:0): Cannot iterate over number (1)",
    },
    {
      j: { foo: 1 },
      q: ".foo.bar",
      e: 'jq: error (at /dev/stdin:0): Cannot index number with string "bar"',
    },
  ].forEach(({ j, q, e }) => {
    test(`j="${JSON.stringify(j)}" q="${q}")`, async () => {
      await expect(jq.json(j, q)).rejects.toThrow(e);
    });
  });
});

describe("json() success", () => {
  [
    {
      j: { foo: "bar", biz: 5 },
      q: "[.foo, .biz] | {res: .}",
      r: { res: ["bar", 5] },
    },
    {
      j: { foo: [1, 2, 3] },
      q: ".foo | .[]",
      r: [1, 2, 3],
    },
    {
      j: {},
      q: ".foo",
      r: null,
    },
  ].forEach(({ j, q, r }) => {
    test(`j="${JSON.stringify(j)}" q="${q}")`, async () => {
      await expect(jq.json(j, q)).resolves.toEqual(r);
    });
  });
});
