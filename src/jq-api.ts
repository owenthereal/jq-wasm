export interface JqModule {
  raw: (
    jsonString: string,
    query: string,
    flags?: string[]
  ) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
  version: () => Promise<string>;
}

type GetInstance = () => Promise<JqModule>;

export function createApi(getInstance: GetInstance) {
  async function raw(
    json: string | object,
    query: string,
    flags: string[] = []
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (typeof query !== "string") {
      throw new TypeError("Invalid argument: 'query' must be a string");
    }

    let input: string;
    if (typeof json === "string") {
      input = json;
    } else if (json && typeof json === "object") {
      try {
        input = JSON.stringify(json);
      } catch (err) {
        throw new Error(`Failed to serialize input object: ${(err as Error).message}`);
      }
    } else {
      throw new TypeError("Invalid argument: 'json' must be a string or non-null object");
    }

    const instance = await getInstance();
    return instance.raw(input, query, flags);
  }

  async function json(
    json: string | object,
    query: string,
    flags: string[] = []
  ): Promise<object | object[] | null> {
    if (typeof query !== "string") {
      throw new TypeError("Invalid argument: 'query' must be a string");
    }

    if (!flags.includes("-c")) {
      flags = ["-c", ...flags];
    }

    const { stdout, stderr } = await raw(json, query, flags);
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

      return lines.map(line => JSON.parse(line));
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
