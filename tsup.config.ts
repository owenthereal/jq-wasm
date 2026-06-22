import { defineConfig } from "tsup";

export default defineConfig([
  // Node entry: dual CJS + ESM.
  {
    entry: { index: "src/index.ts" },
    format: ["cjs", "esm"],
    dts: true,
    clean: false,
    shims: true, // provides __dirname in the ESM output
    outExtension({ format }) {
      return { js: format === "cjs" ? ".cjs" : ".mjs" };
    },
  },
  // Edge + browser entries: ESM only. Keep the .wasm import external so the
  // consumer's bundler (wrangler) resolves it to a WebAssembly.Module.
  {
    entry: { edge: "src/edge.ts", browser: "src/browser.ts" },
    format: ["esm"],
    dts: true,
    clean: false,
    shims: true,
    external: ["./build/jq.wasm"],
    outExtension() {
      return { js: ".mjs" };
    },
  },
]);
