/**
 * browser.ts — browser / portable default entry point.
 *
 * Fetches the sibling jq.wasm asset and streams it into Emscripten.
 */
import jqRuntime from "./build/jq.js";
import { createApi, type JqModule } from "./jq-api";

let instancePromise: Promise<JqModule> | null = null;

function getInstance(): Promise<JqModule> {
  if (!instancePromise) {
    const wasmUrl = new URL("./build/jq.wasm", import.meta.url);
    instancePromise = jqRuntime({
      instantiateWasm(
        imports: WebAssembly.Imports,
        onSuccess: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void
      ) {
        void (async () => {
          try {
            const { instance, module } = await WebAssembly.instantiateStreaming(
              fetch(wasmUrl),
              imports
            );
            onSuccess(instance, module);
          } catch {
            // Fallback for servers that don't send application/wasm.
            const response = await fetch(wasmUrl);
            const { instance, module } = await WebAssembly.instantiate(
              await response.arrayBuffer(),
              imports
            );
            onSuccess(instance, module);
          }
        })();
        return {};
      },
    }) as Promise<JqModule>;
  }
  return instancePromise;
}

export const { raw, json, version } = createApi(getInstance);
