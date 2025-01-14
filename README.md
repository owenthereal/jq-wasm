# jq-wasm

**jq-wasm** compiles the powerful [jq](https://github.com/jqlang/jq/) JSON processor into WebAssembly using [Emscripten](https://emscripten.org/). This package makes it easy to execute jq filters directly in **Node.js** or modern browsers without any native dependencies.

## Installation

```bash
npm install jq-wasm
```

or using Yarn:

```bash
yarn add jq-wasm
```

## Usage

### Basic Example

```js
const jq = require("jq-wasm")
// or, using ES modules:
// import jq from "jq-wasm"

async function main() {
  try {
    const result = await jq.json({ foo: "bar" }, ".foo")
    console.log(result) // Output: ["bar"]

    // Using jq.raw to get the plain text output
    const rawResult = await jq.raw({ foo: "bar" }, ".", ["-c"])
    console.log(rawResult) // Output: '{"foo":"bar"}'
  } catch (err) {
    console.error(err.message)
  }
}

main()
```

### API

`jq.json(input, filter, [flags])`

- **input**: A JSON object (or an array) in JavaScript.
- **filter**: A jq filter string (e.g., ".foo", ".[]", etc.).
- **flags (optional)**: An array of command-line style flags (e.g., ["-c"] for compact output).

**Returns**: A Promise that resolves with an array of parsed JSON results.

`jq.raw(input, filter, [flags])`

- **input**: A JSON object (or an array) in JavaScript.
- **filter**: A jq filter string.
- **flags (optional)**: An array of command-line style flags (e.g., ["-c"]).

**Returns**: A Promise that resolves with the raw string output (exactly as the jq command-line tool would produce).

## License

This project is licensed under the [MIT License](LICENSE.md).
It bundles code from the [jq](https://github.com/jqlang/jq) project, which is licensed under its own terms.
Please see their repository for detailed licensing information.
