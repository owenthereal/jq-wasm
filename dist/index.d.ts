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
export declare function raw(data: string | object, filter: string, flags?: string[]): Promise<string>;
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
export declare function json(data: string | object, filter: string, flags?: string[]): Promise<object | object[] | null>;
