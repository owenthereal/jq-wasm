/**
 * inline.ts — self-contained entry with the wasm embedded as bytes.
 *
 * For consumers where `new URL("./build/jq.wasm", import.meta.url)` assets are
 * NOT emitted by the toolchain — esbuild (evanw/esbuild#795), no bundler at all,
 * or a raw `<script type=module>`. The wasm is bundled in (larger payload, no
 * streaming compilation), so there is no separate asset to serve.
 */
import jqRuntime from "./build/jq.js";
import wasmAsset from "./build/jq.wasm";
import { createApi, type JqModule } from "./jq-api";

// The inline build compiles `.wasm` with esbuild's `binary` loader, so this is
// the wasm bytes (a Uint8Array), not a WebAssembly.Module (cf. wasm.d.ts, which
// types the import for the edge build's module loader).
const wasmBinary = wasmAsset as unknown as Uint8Array;

let instancePromise: Promise<JqModule> | null = null;

function getInstance(): Promise<JqModule> {
  if (!instancePromise) {
    instancePromise = jqRuntime({ wasmBinary }) as Promise<JqModule>;
  }
  return instancePromise;
}

export const { raw, json, version } = createApi(getInstance);
