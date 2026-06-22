/**
 * index.ts — Node entry point.
 *
 * Loads the two-file Emscripten build, supplying the wasm bytes from disk so
 * the same artifact serves Node, browsers, and Workers (see edge.ts/browser.ts).
 */
import jqRuntime from "./build/jq.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createApi, type JqModule } from "./jq-api";

let instancePromise: Promise<JqModule> | null = null;

function getInstance(): Promise<JqModule> {
  if (!instancePromise) {
    const wasmBinary = readFileSync(join(__dirname, "build", "jq.wasm"));
    instancePromise = jqRuntime({ wasmBinary }) as Promise<JqModule>;
  }
  return instancePromise;
}

export const { raw, json, version } = createApi(getInstance);
