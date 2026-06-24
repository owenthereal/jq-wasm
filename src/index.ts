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
    const wasmPath = join(__dirname, "build", "jq.wasm");
    let wasmBinary: Buffer;
    try {
      wasmBinary = readFileSync(wasmPath);
    } catch (err) {
      // The default Node build reads jq.wasm relative to itself; a single-file
      // app bundle (e.g. esbuild --platform=node, ncc) doesn't copy it, so point
      // the user at the self-contained entry instead of a bare ENOENT.
      throw new Error(
        `jq-wasm: could not read the wasm asset at ${wasmPath}. If you bundle your ` +
          `app into a single file, import "jq-wasm/inline" instead — it embeds the ` +
          `wasm and needs no separate asset. (${(err as Error).message})`
      );
    }
    instancePromise = jqRuntime({ wasmBinary }) as Promise<JqModule>;
  }
  return instancePromise;
}

export const { raw, json, version } = createApi(getInstance);
