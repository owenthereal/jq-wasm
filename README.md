# jq-wasm

**jq-wasm** is a WebAssembly-powered version of the powerful [jq](https://github.com/jqlang/jq/) JSON processor, built using [Emscripten](https://emscripten.org/). It allows you to use jq directly in **Node.js** or modern browsers without requiring any native dependencies.

Whether you’re filtering, transforming, or querying JSON data, `jq-wasm` brings the versatility of jq to your JavaScript/TypeScript projects.

## 🚀 Features

- **Node.js and Browser Support**: Run jq in both server-side and client-side environments.
- **No Native Dependencies**: Works seamlessly without additional libraries or build tools.
- **Fully Typed**: Includes TypeScript definitions for a smooth development experience.
- **Familiar jq API**: Supports standard jq filters and flags.

## 📦 Installation

Install with npm:

```bash
npm install jq-wasm
```

or with Yarn:

```bash
yarn add jq-wasm
```

## 🛠️ Usage

```js
const jq = require("jq-wasm");
// or using ES modules:
// import jq from "jq-wasm";

(async () => {
  try {
    // Example JSON input
    const input = { foo: "bar", list: [1, 2, 3] };

    // Using jq.raw for raw text output
    const rawResult = await jq.raw(input, ".list | .[]", ["-c"]);
    console.log(rawResult); // Output: "1\n2\n3"

    // Using jq.json for parsed JSON output
    const result = await jq.json(input, ".foo");
    console.log(result); // Output: ["bar"]
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
```

## 📖 API

### `jq.raw(input, filter, [flags])`

Executes a jq filter and returns raw string output, exactly as jq would produce.

#### Parameters

- **`input`**: A JavaScript object or array (the JSON input).
- **`filter`**: A jq filter string.
- **`flags`** (optional): An array of jq command-line flags.

#### Returns

A Promise that resolves to:

- **Raw string**: The jq output as a plain text string.

---

### `jq.json(input, filter, [flags])`

Executes a jq filter on a JSON object and returns parsed JSON results.

#### Parameters

- **`input`**: A JavaScript object or array (the JSON input).
- **`filter`**: A jq filter string (e.g., `.foo`, `.[].bar`, etc.).
- **`flags`** (optional): An array of jq command-line flags (e.g., `["-c"]` for compact output).

#### Returns

A Promise that resolves to:

- **Single parsed JSON object or array**: For a single jq result.
- **Array of parsed JSON objects or arrays**: For multiple results.

## 📚 License

This project is licensed under the [MIT License](LICENSE).

## 🌟 Contributions

Contributions, issues, and feature requests are welcome! Feel free to check out the issues page.
