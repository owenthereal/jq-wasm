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
        WebAssembly.instantiateStreaming(fetch(wasmUrl), imports)
          .then((result) => onSuccess(result.instance, result.module))
          .catch(async () => {
            const bytes = await fetch(wasmUrl).then((r) => r.arrayBuffer());
            const result = await WebAssembly.instantiate(bytes, imports);
            onSuccess(result.instance, result.module);
          });
        return {};
      },
    }) as Promise<JqModule>;
  }
  return instancePromise;
}

export const { raw, json, version } = createApi(getInstance);
