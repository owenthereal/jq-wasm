/**
 * jq-api.ts
 *
 * Shared public API for the jq runtime, independent of how the underlying
 * Emscripten instance is loaded. Each platform entry point (Node, Workers,
 * browser) provides its own `getInstance` and re-exports this surface.
 */

export interface JqModule {
  raw(
    jsonString: string,
    query: string,
    flags?: string[]
  ): Promise<{ stdout: string; stderr: string; exitCode: number }>;
  version(): Promise<string>;
}

export function createApi(getInstance: () => Promise<JqModule>) {
  async function raw(
    input: string | object,
    query: string,
    flags: string[] = []
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (typeof query !== "string") {
      throw new TypeError("Invalid argument: 'query' must be a string");
    }
    let jsonString: string;
    if (typeof input === "string") {
      jsonString = input;
    } else if (input && typeof input === "object") {
      try {
        jsonString = JSON.stringify(input);
      } catch (err) {
        throw new Error(`Failed to serialize input object: ${(err as Error).message}`);
      }
    } else {
      throw new TypeError("Invalid argument: 'json' must be a string or non-null object");
    }
    const instance = await getInstance();
    return instance.raw(jsonString, query, flags);
  }

  async function json(
    input: string | object,
    query: string,
    flags: string[] = []
  ): Promise<object | object[] | null> {
    if (typeof query !== "string") {
      throw new TypeError("Invalid argument: 'query' must be a string");
    }
    if (!flags.includes("-c")) {
      flags = ["-c", ...flags];
    }
    const { stdout, stderr } = await raw(input, query, flags);
    if (stderr) {
      const message = stdout ? `${stdout}\n${stderr}` : stderr;
      throw new Error(message.trim());
    }
    if (!stdout) {
      return null;
    }
    const lines = stdout.split("\n").filter(Boolean);
    try {
      if (lines.length === 1) {
        return JSON.parse(lines[0]);
      }
      return lines.map((line) => JSON.parse(line));
    } catch {
      throw new Error(stdout);
    }
  }

  async function version(): Promise<string> {
    const instance = await getInstance();
    return instance.version();
  }

  return { raw, json, version };
}
