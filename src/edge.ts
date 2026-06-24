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
    instancePromise = new Promise<JqModule>((resolve, reject) => {
      const runtime = jqRuntime({
        instantiateWasm(
          imports: WebAssembly.Imports,
          onSuccess: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void
        ) {
          // Surface instantiation failures (e.g. an invalid module) by
          // rejecting, instead of leaving the runtime waiting for onSuccess.
          WebAssembly.instantiate(jqModule, imports).then(
            (instance) => onSuccess(instance, jqModule),
            reject
          );
          return {};
        },
      }) as Promise<JqModule>;
      runtime.then(resolve, reject);
    });
  }
  return instancePromise;
}

export const { raw, json, version } = createApi(getInstance);
