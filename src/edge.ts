/**
 * edge.ts — Cloudflare Workers / edge entry point.
 *
 * Workers forbid compiling wasm from bytes at runtime, so the .wasm is imported
 * as a pre-compiled WebAssembly.Module and handed to Emscripten via instantiateWasm.
 */
import jqRuntime from "./build/jq.js";
import jqModule from "./build/jq.wasm";
import { createApi, type JqModule } from "./jq-api";

let instancePromise: Promise<JqModule> | null = null;

function getInstance(): Promise<JqModule> {
  if (!instancePromise) {
    instancePromise = jqRuntime({
      instantiateWasm(
        imports: WebAssembly.Imports,
        onSuccess: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void
      ) {
        WebAssembly.instantiate(jqModule, imports).then((instance) =>
          onSuccess(instance, jqModule)
        );
        return {};
      },
    }) as Promise<JqModule>;
  }
  return instancePromise;
}

export const { raw, json, version } = createApi(getInstance);
