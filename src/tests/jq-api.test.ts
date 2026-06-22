import { createApi, type JqModule } from "../jq-api";

function fakeInstance(impl: Partial<JqModule> = {}): JqModule {
  return {
    raw: impl.raw ?? (async () => ({ stdout: "", stderr: "", exitCode: 0 })),
    version: impl.version ?? (async () => "jq-1.8.2"),
  };
}

describe("createApi", () => {
  test("raw() rejects a non-string query", async () => {
    const { raw } = createApi(async () => fakeInstance());
    await expect(raw({}, 123 as unknown as string)).rejects.toThrow(
      "Invalid argument: 'query' must be a string"
    );
  });

  test("raw() stringifies object input before calling the instance", async () => {
    let seen = "";
    const { raw } = createApi(async () =>
      fakeInstance({
        raw: async (input) => {
          seen = input;
          return { stdout: "ok", stderr: "", exitCode: 0 };
        },
      })
    );
    await raw({ a: 1 }, ".");
    expect(seen).toBe('{"a":1}');
  });

  test("json() prepends -c and parses a single line", async () => {
    const { json } = createApi(async () =>
      fakeInstance({ raw: async () => ({ stdout: '{"a":1}', stderr: "", exitCode: 0 }) })
    );
    await expect(json({}, ".")).resolves.toEqual({ a: 1 });
  });

  test("json() throws when stderr is non-empty", async () => {
    const { json } = createApi(async () =>
      fakeInstance({ raw: async () => ({ stdout: "", stderr: "boom", exitCode: 5 }) })
    );
    await expect(json({}, ".")).rejects.toThrow("boom");
  });
});
