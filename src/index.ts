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

import jqRuntime from "./lib/jq.js";

// Define the type for the Emscripten module
interface JqModule {
  raw: (jsonString: string, query: string, flags?: string[]) => Promise<string>;
}

// Singleton Promise for the Emscripten module instance
let instancePromise: Promise<JqModule> | null = null;

/**
 * Retrieves a shared jq instance. Initializes it lazily on the first call.
 *
 * @returns {Promise<JqModule>} - A promise that resolves with the Emscripten module instance.
 */
function getInstance(): Promise<JqModule> {
  if (!instancePromise) {
    instancePromise = jqRuntime() as Promise<JqModule>;
  }
  return instancePromise;
}

/**
 * Execute a jq query and return raw string output.
 *
 * @param {string | object} data - The JSON input. If an object is passed, it will be JSON-stringified.
 * @param {string} filter - The jq filter string (e.g., ".foo", ".[].bar").
 * @param {string[]} [flags=[]] - Optional array of jq flags (e.g., ["-r", "-c"]).
 * @returns {Promise<string>} - A promise that resolves with the raw string output of jq.
 * @throws {TypeError} - If input types are incorrect.
 * @throws {Error} - If jq execution fails.
 */
export async function raw(data: string | object, filter: string, flags: string[] = []): Promise<string> {
  // Validate input types early to avoid unnecessary processing
  if (typeof filter !== "string") {
    throw new TypeError("Invalid argument: 'filter' must be a string");
  }

  // Optimize JSON stringification: only stringify if necessary
  let input: string;
  if (typeof data === "string") {
    input = data;
  } else if (typeof data === "object" && data !== null) {
    try {
      input = JSON.stringify(data);
    } catch (err) {
      throw new Error(`Failed to serialize input object: ${(err as Error).message}`);
    }
  } else {
    throw new TypeError("Invalid argument: 'data' must be a non-null object or string");
  }

  try {
    const instance = await getInstance();
    // Directly return the raw output without additional await
    return instance.raw(input, filter, flags);
  } catch (error) {
    // Enhance error messages for better debugging
    throw new Error(`Failed to execute raw query: ${(error as Error).message}`);
  }
}

/**
 * Execute a jq query and parse the result as JSON.
 * Automatically splits multiple outputs (separated by newlines) into an array.
 *
 * @param {string | object} data - The input to process. If an object is passed, it is JSON-stringified.
 * @param {string} filter - The jq filter string.
 * @param {string[]} [flags=[]] - Optional array of jq flags.
 * @returns {Promise<any | any[]>} - A promise that resolves with:
 *   - A single JS object/array if jq outputs one JSON result.
 *   - An array of JS objects/arrays if jq outputs multiple results (one per line).
 *   - null if no output is produced.
 * @throws {TypeError} - If input types are incorrect.
 * @throws {Error} - If jq execution or JSON parsing fails.
 */
export async function json(data: string | object, filter: string, flags: string[] = []): Promise<object | object[] | null> {
  // Validate input types early
  if (typeof filter !== "string") {
    throw new TypeError("Invalid argument: 'filter' must be a string");
  }

  // Ensure '-c' flag is present for compact JSON output; avoid duplicates
  if (!flags.includes("-c")) {
    flags = ["-c", ...flags];
  }

  try {
    // Reuse the raw() function to get the string output
    const output = await raw(data, filter, flags);
    const trimmed = output.trim();

    if (!trimmed) {
      // No output from jq
      return null;
    }

    // Check if output contains multiple JSON objects separated by newlines
    const hasMultipleOutputs = trimmed.includes("\n");
    if (hasMultipleOutputs) {
      // Split by newlines and parse each JSON line
      return trimmed
        .split("\n")
        .filter(Boolean) // Remove any empty lines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (parseError) {
            throw new Error(`Failed to parse JSON output: ${(parseError as Error).message}`);
          }
        });
    }

    // Single JSON object or array
    try {
      return JSON.parse(trimmed);
    } catch (parseError) {
      throw new Error(`Failed to parse JSON output: ${(parseError as Error).message}`);
    }
  } catch (error) {
    // Enhance error messages for better debugging
    throw new Error(`Failed to execute JSON query: ${(error as Error).message}`);
  }
}
