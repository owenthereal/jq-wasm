/**
 * pre.js
 *
 * Injected by Emscripten via the --pre-js compile flag.
 * Responsibilities:
 *   - Manage STDIN/STDOUT/STDERR for jq
 *   - Wait for WebAssembly runtime initialization
 *   - Expose a promise-based 'raw' method returning { stdout, stderr, exitCode }
 *   - Expose a dedicated method to retrieve the jq version via version()
 *   - Suppress specific Emscripten warning messages
 *   - Ensure no state is accumulated between runs
 */

// Runtime initialization promise
let runtimeInitResolve;
const runtimeInitPromise = new Promise((resolve) => {
  runtimeInitResolve = resolve;
});

// UTF-8 encoder/decoder
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Converts a string to a UTF-8 Uint8Array.
 * @param {string} str - The string to convert.
 * @returns {Uint8Array} - The resulting byte array.
 */
function toByteArray(str) {
  return encoder.encode(str);
}

/**
 * Creates a growable byte sink backed by a Uint8Array.
 * Appends are amortized O(1) and storage stays compact, so large stdout/stderr
 * output is captured efficiently and losslessly — no per-byte boxing into a
 * plain Array and no final Array -> Uint8Array copy when decoding.
 *
 * @param {number} initialCapacity - Initial buffer capacity in bytes.
 * @returns {{ push(byte: number): void, reset(): void, toString(): string }}
 */
function createByteSink(initialCapacity) {
  let bytes = new Uint8Array(initialCapacity);
  let length = 0;
  return {
    push(byte) {
      if (length >= bytes.length) {
        const grown = new Uint8Array(bytes.length * 2);
        grown.set(bytes);
        bytes = grown;
      }
      bytes[length++] = byte;
    },
    reset() {
      length = 0;
    },
    toString() {
      return decoder.decode(bytes.subarray(0, length));
    },
  };
}

// Output sinks, created after createByteSink is defined.
const stdoutSink = createByteSink(1024);
const stderrSink = createByteSink(256);

// jq's input is fed through the /dev/stdin device, seeded each run and drained via
// an offset cursor (O(1) per byte). Keeping /dev/stdin as the original one-shot
// device preserves jq's CLI semantics for every input mode — error locations, the
// `input_filename` builtin, `--rawfile`/`--slurpfile /dev/stdin`, `--args`, and
// EOF on a second read all behave as in 1.1.0. Only the draining is fixed, from
// O(n^2) (the previous stdinBuffer.slice(1) per byte) to O(n) (issue #7).
let stdinBuffer = new Uint8Array(0);
let stdinBufferOffset = 0;
const STDIN_PATH = "/dev/stdin";

/**
 * Executes jq with the given arguments.
 * This helper handles stack saving/restoring, exit code management, and buffer resets.
 *
 * @param {string[]} args - Arguments to pass to jq.
 * @returns {{ stdout: string, stderr: string, exitCode: number }}
 */
function executeJq(args) {
  const stackBefore = stackSave();
  const preExitCode = (typeof process !== "undefined") ? process.exitCode : undefined;

  // Reset output sinks.
  stdoutSink.reset();
  stderrSink.reset();

  let exitCode;
  try {
    exitCode = Module.callMain(args);
  } finally {
    if (typeof process !== "undefined") {
      process.exitCode = preExitCode !== undefined ? preExitCode : 0;
    }
    stackRestore(stackBefore);
  }
  return {
    stdout: stdoutSink.toString().trim(),
    stderr: stderrSink.toString().trim(),
    exitCode,
  };
}

/**
 * Runs a jq query and returns its output.
 *
 * @param {string} jsonString - The input JSON string.
 * @param {string} query - The jq query string.
 * @param {string[]} flags - Additional jq flags.
 * @returns {{ stdout: string, stderr: string, exitCode: number }}
 */
function runJq(jsonString, query, flags) {
  // Seed the /dev/stdin device with the input; preRun's offset cursor drains it
  // in O(n). /dev/stdin stays the original one-shot device, so every input mode
  // matches the jq CLI (see the note by stdinBuffer above).
  stdinBuffer = toByteArray(jsonString);
  stdinBufferOffset = 0;
  // Ensure monochrome output.
  if (!flags.includes('-M')) {
    flags = ['-M', ...flags];
  }
  // Pass /dev/stdin positionally so jq reads the seeded device as its input.
  const args = [...flags, query, STDIN_PATH];
  try {
    return executeJq(args);
  } finally {
    // Drop the input so nothing leaks into the next run.
    stdinBuffer = new Uint8Array(0);
    stdinBufferOffset = 0;
  }
}

/**
 * Runs jq with the "--version" flag to retrieve the jq version.
 * Returns just the version string or throws an error if any stderr is produced.
 *
 * @returns {string} - The jq version string.
 */
function runJqVersion() {
  const result = executeJq(["--version"]);
  if (result.stderr) {
    throw new Error(result.stderr);
  }
  return result.stdout;
}

// Override the Emscripten Module with custom configuration.
Module = {
  ...Module,

  // Prevent automatic execution of main.
  noInitialRun: true,

  // Keep the runtime alive for repeated use.
  noExitRuntime: true,

  /**
   * Called once the WASM runtime is fully initialized.
   */
  onRuntimeInitialized() {
    runtimeInitResolve();
  },

  /**
   * Override the default error-logging function to suppress
   * specific exit warnings while still logging genuine errors.
   * @param {string} message - The error message.
   */
  printErr(message) {
    if (typeof message === 'string' && message.includes('program exited (with status:')) {
      return;
    }
    console.error(message);
  },

  /**
   * Setup virtual STDIN/STDOUT/STDERR.
   */
  preRun() {
    FS.init(
      // STDIN device: drains the seeded input (see runJq) via an offset cursor —
      // O(1) per byte, where the original sliced per byte (O(n^2), issue #7). This
      // is /dev/stdin and fd 0, so jq reads it for positional input,
      // --rawfile/--slurpfile /dev/stdin, and --args alike.
      () => {
        if (stdinBufferOffset >= stdinBuffer.length) return null;
        return stdinBuffer[stdinBufferOffset++] ?? null;
      },
      // STDOUT handler: collect each byte into the growable sink.
      (byte) => {
        if (byte != null) stdoutSink.push(byte);
      },
      // STDERR handler: collect each byte into the growable sink.
      (byte) => {
        if (byte != null) stderrSink.push(byte);
      }
    );
  },

  /**
   * Promise-based function to run jq and obtain stdout, stderr, and the exit code.
   *
   * @param {string} jsonString - The input JSON string.
   * @param {string} query - The jq filter.
   * @param {string[]} [flags=[]] - Optional array of jq flags.
   * @returns {Promise<{ stdout: string, stderr: string, exitCode: number }>}
   */
  raw(jsonString, query, flags = []) {
    return runtimeInitPromise.then(() => runJq(jsonString, query, flags));
  },

  /**
   * Promise-based function to return jq's version string.
   *
   * @returns {Promise<string>}
   */
  version() {
    return runtimeInitPromise.then(() => runJqVersion());
  },
};
