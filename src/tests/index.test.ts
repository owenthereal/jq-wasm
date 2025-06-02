import { raw, json, version } from "../index";

describe("json() error cases", () => {
  const errorCases = [
    {
      j: { foo: "bar", biz: 5 },
      q: "[.foo, .biz] | ",
      e: /jq: error: syntax error, unexpected end of file.*\[\.foo, \.biz\].*compile error/s,
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
  ];

  test.each(errorCases)(
    'json(%j, "%s") should throw error containing "%s"',
    async ({ j, q, e }) => {
      await expect(json(j, q)).rejects.toThrow(e);
    }
  );
});

describe("json() success cases", () => {
  const successCases = [
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
  ];

  test.each(successCases)(
    'json(%j, "%s") should resolve to %j',
    async ({ j, q, r }) => {
      await expect(json(j, q)).resolves.toEqual(r);
    }
  );
});

describe("raw() cases", () => {
  const rawCases = [
    {
      j: { "0": 1 },
      q: `.["0",1,2,"0"]`,
      stdout: "1",
      stderr: "jq: error (at /dev/stdin:0): Cannot index object with number",
      exitCode: 5,
    },
    {
      j: { "0": 1 },
      q: `.["0","0",1,2]`,
      stdout: "1\n1",
      stderr: "jq: error (at /dev/stdin:0): Cannot index object with number",
      exitCode: 5,
    },
    {
      j: { "0": 1 },
      q: `.[1,"0","0"]`,
      stdout: "",
      stderr: "jq: error (at /dev/stdin:0): Cannot index object with number",
      exitCode: 5,
    },
  ];

  test.each(rawCases)(
    'raw(%j, "%s") should resolve to { stdout: "%s", stderr: "%s" }',
    async ({ j, q, stdout, stderr, exitCode }) => {
      await expect(raw(j, q)).resolves.toEqual({ stdout, stderr, exitCode });
    }
  );
});

describe("version()", () => {
  test("should return a valid jq version string", async () => {
    const ver = await version();
    // Check that the version starts with "jq-" and a semantic version,
    expect(ver).toMatch(/^jq-\d+\.\d+\.\d+/);
  });
});
