# jq-wasm

`jq-wasm` compiles [`jq`](https://github.com/jqlang/jq/) into WebAssembly using [Emscripten](https://emscripten.org/)
and packages it into a NPM package for consumsion.

## Usage

```js
const jq = require("jq-wasm")

jq.json({ foo: "bar" }, ".foo")
    .then(result => console.log(result))
    .catch(e => console.error(e.message))

jq.raw({ foo: "bar" }, ".", ["-c"])
    .then(result => console.log(result))
    .catch(e => console.error(e.message))
```

`jq.json` takes a JSON object and a filter. `jq.raw` takes a JSON object, a filter and the optional array of commandline flags.
