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
      e: 'jq: error (at /dev/stdin:0): Cannot index number with string ("bar")',
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
      stderr: "jq: error (at /dev/stdin:0): Cannot index object with number (1)",
      exitCode: 5,
    },
    {
      j: { "0": 1 },
      q: `.["0","0",1,2]`,
      stdout: "1\n1",
      stderr: "jq: error (at /dev/stdin:0): Cannot index object with number (1)",
      exitCode: 5,
    },
    {
      j: { "0": 1 },
      q: `.[1,"0","0"]`,
      stdout: "",
      stderr: "jq: error (at /dev/stdin:0): Cannot index object with number (1)",
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

describe("large input (issue #7)", () => {
  // Regression guard for the O(n^2) stdin slowdown. A ~0.5 MB input must finish
  // well under jest's default 5s timeout now that jq reads it in bulk; the old
  // slice-per-byte path took ~7-10s and would time out here.
  test("processes a large input quickly and correctly", async () => {
    const n = 50_000;
    const input = Array.from({ length: n }, (_, i) => ({ i }));
    await expect(json(input, "length")).resolves.toEqual(n);
  });

  // Exercises the growable output sink across many output values.
  test("captures large multi-line output", async () => {
    const n = 2_000;
    const input = Array.from({ length: n }, (_, i) => i);
    const result = (await json(input, ".[]")) as unknown as number[];
    expect(result).toHaveLength(n);
    expect(result[n - 1]).toEqual(n - 1);
  });
});

describe("/dev/stdin compatibility", () => {
  // The input is served as a regular file mounted at /dev/stdin, so flags that
  // read the device directly and jq's input_filename builtin behave exactly as
  // they did before the bulk-read change (PR #9 review).
  test("--rawfile reading /dev/stdin receives the input", async () => {
    const input = '{"hello":"world"}';
    const { stdout, stderr, exitCode } = await raw(input, "$x", [
      "-n",
      "--rawfile",
      "x",
      "/dev/stdin",
    ]);
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toBe(input);
  });

  test("--slurpfile reading /dev/stdin receives the input", async () => {
    const { stdout, stderr, exitCode } = await raw("[1,2,3]", "$x", [
      "-n",
      "--slurpfile",
      "x",
      "/dev/stdin",
    ]);
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toEqual([[1, 2, 3]]);
  });

  test("input_filename reports /dev/stdin", async () => {
    const { stdout, stderr, exitCode } = await raw('{"a":1}', "input_filename", [
      "-c",
    ]);
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toBe("/dev/stdin");
  });

  test("--args still feeds the input through fd 0", async () => {
    // With --args, jq treats the trailing /dev/stdin as a positional string and
    // reads the actual input from fd 0, which must stay backed.
    const { stdout, stderr, exitCode } = await raw('{"a":1}', ".a", [
      "-c",
      "--args",
    ]);
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toBe(1);
  });

  test("/dev/stdin is one-shot when read twice", async () => {
    // Without -n, the implicit main input also reads /dev/stdin. Like the jq CLI,
    // the device is one-shot: --rawfile consumes it and the main loop sees EOF
    // (no output) rather than replaying the bytes.
    const { stdout, stderr, exitCode } = await raw('{"a":1}', "$x", [
      "-c",
      "--rawfile",
      "x",
      "/dev/stdin",
    ]);
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(stdout).toBe("");
  });
});
