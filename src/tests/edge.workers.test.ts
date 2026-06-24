import { describe, test, expect } from "vitest";
import { raw, json, version } from "../edge";

describe("edge entry (workerd)", () => {
  test("raw() runs a basic query", async () => {
    const r = await raw('{"a":1}', ".a");
    expect(r.stdout.trim()).toBe("1");
    expect(r.exitCode).toBe(0);
  });

  test("version() returns a jq version", async () => {
    expect(await version()).toMatch(/^jq-\d+\.\d+\.\d+/);
  });

  test("large input (issue #7) stays fast on the edge build", async () => {
    const n = 50_000;
    const input = Array.from({ length: n }, (_, i) => ({ i }));
    await expect(json(input, "length")).resolves.toEqual(n);
  });
});
