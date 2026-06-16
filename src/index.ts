/**
 * index.ts
 *
 * A high-performance wrapper around the Emscripten-compiled jq runtime.
 * Provides:
 *   - A singleton, lazy-loaded jq instance
 *   - Promise-based functions: raw() and json()
 *   - Automatic JSON stringification and parsing
 *   - Efficient buffer handling and minimal overhead
 *   - A function to get the underlying jq version
 */
import jqRuntime from "./build/jq.js";
import { createApi, type JqModule } from "./jq-api";

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

export const { raw, json, version } = createApi(getInstance);
