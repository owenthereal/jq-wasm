/**
 * index.ts
 *
 * A high-performance wrapper around the Emscripten-compiled jq runtime.
 * Provides:
 *   - A singleton, lazy-loaded jq instance
 *   - Promise-based functions: raw() and json()
 *   - Automatic JSON stringification and parsing
 *   - Efficient buffer handling and minimal overhead
 */

import jqRuntime from "./build/jq.js";

interface JqModule {
  raw: (
    jsonString: string,
    query: string,
    flags?: string[]
  ) => Promise<{ stdout: string; stderr: string, exitCode: number }>;
}

let instancePromise: Promise<JqModule> | null = null;

/**
 * Lazily initializes and retrieves the jq instance.
 */
function getInstance(): Promise<JqModule> {
  if (!instancePromise) {
    instancePromise = jqRuntime() as Promise<JqModule>;
  }
  return instancePromise;
}

/**
 * Execute a jq query and return both stdout and stderr.
 *
 * @param json - The input JSON (string or object).
 * @param query - The jq filter string.
 * @param flags - Optional jq flags (e.g., ["-r", "-c"]).
 * @returns A promise resolving to { stdout, stderr }.
 * @throws {TypeError} If input types are invalid.
 */
export async function raw(
  json: string | object,
  query: string,
  flags: string[] = []
): Promise<{ stdout: string; stderr: string, exitCode: number }> {
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

/**
 * Execute a jq query and parse the result as JSON.
 * Throws if jq produces any stderr output.
 *
 * @param json - The input JSON.
 * @param query - The jq filter.
 * @param flags - Optional jq flags.
 * @returns Parsed JSON or array of parsed results.
 * @throws If stderr is non-empty or JSON parsing fails.
 */
export async function json(
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
