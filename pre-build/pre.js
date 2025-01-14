/**
 * pre.js
 *
 * Injected by Emscripten via the --pre-js compile flag.
 * Responsibilities:
 *   - Manage STDIN/STDOUT/STDERR for jq
 *   - Wait for WebAssembly runtime initialization
 *   - Expose a promise-based 'raw' method
 *   - Suppress specific Emscripten warning messages
 *   - Ensure no state is accumulated between runs
 */

// Buffers and variables for STDIN, STDOUT, and STDERR
let stdinString = '';
let stdinBuffer = new Uint8Array(0);
let stdoutBuffer = new Uint8Array(0);
let stderrBuffer = new Uint8Array(0);

// Create a Promise that resolves once the runtime initializes
let runtimeInitResolve;
const runtimeInitPromise = new Promise((resolve) => {
  runtimeInitResolve = resolve;
});

/**
 * Converts a UTF-8 string to a Uint8Array.
 * @param {string} str - The string to convert.
 * @returns {Uint8Array} - The resulting byte array.
 */
function toByteArray(str) {
  return new TextEncoder('utf-8').encode(str);
}

/**
 * Converts a Uint8Array to a UTF-8 string.
 * @param {Uint8Array} data - The data to convert.
 * @returns {string} - The resulting string.
 */
function fromByteArray(data) {
  return new TextDecoder('utf-8').decode(data);
}

/**
 * Internal implementation of the jq "raw" call:
 *   - Writes `jsonString` to STDIN
 *   - Resets stdout/stderr
 *   - Calls `Module.callMain` with the provided flags + query
 *   - Returns stdout as a trimmed string or throws on stderr
 *
 * @param {string} jsonString - The JSON input string.
 * @param {string} query - The jq filter string (e.g., '.foo').
 * @param {string[]} flags - Additional jq flags (e.g., ['-c', '-r']).
 * @returns {string} - The raw jq output (trimmed).
 * @throws {Error} - If jq execution fails.
 */
function rawImpl(jsonString, query, flags) {
  // 1. Reset all buffers for a clean state
  stdinString = jsonString;
  stdinBuffer = toByteArray(stdinString);
  stdoutBuffer = new Uint8Array(0);
  stderrBuffer = new Uint8Array(0);

  // 2. Ensure monochrome output to avoid color codes
  if (!flags.includes('-M')) {
    flags = ["-M", ...flags];
  }

  // 3. Execute jq with the provided flags and query
  Module.callMain([...flags, query, '/dev/stdin']);

  // 4. Process and return stdout
  if (stdoutBuffer.length > 0) {
    return fromByteArray(stdoutBuffer).trim();
  }

  // 5. If there's content in stderr, throw an error
  if (stderrBuffer.length > 0) {
    const errorString = fromByteArray(stderrBuffer).trim();
    throw new Error(errorString);
  }

  // 6. No output produced
  return '';
}

/**
 * Override Emscripten module configuration.
 *   - Prevent calling `main()` automatically (noInitialRun: true).
 *   - Keep runtime alive for repeated usage (noExitRuntime: true).
 *   - Provide a promise-based `raw` method.
 *   - Suppress specific warning messages.
 */
Module = {
  ...Module,

  // Prevent Emscripten from running main automatically
  noInitialRun: true,

  // Keep the runtime alive to allow multiple jq executions
  noExitRuntime: true,

  /**
   * Called by Emscripten after the WASM runtime is fully loaded.
   */
  onRuntimeInitialized() {
    runtimeInitResolve();
  },

  /**
   * Override the default error-logging function to suppress
   * "program exited (with status: X)..." warnings,
   * while still allowing other error messages.
   *
   * @param {string} message - The error message to log.
   */
  printErr(message) {
    if (typeof message === 'string' && message.includes('program exited (with status:')) {
      // Suppress specific exit warnings
      return;
    }
    // Log other errors normally
    console.error(message);
  },

  /**
   * Called by Emscripten before `main()` executes.
   * Initializes the filesystem for STDIN/STDOUT/STDERR.
   */
  preRun() {
    FS.init(
      // STDIN handler
      () => {
        if (stdinBuffer.length > 0) {
          // Read the next byte
          const byte = stdinBuffer[0];
          stdinBuffer = stdinBuffer.slice(1);
          return byte;
        }
        // No more data
        return null;
      },
      // STDOUT handler
      (charCode) => {
        if (charCode !== null && charCode !== undefined) {
          // Efficiently append to stdoutBuffer
          const tmp = new Uint8Array(stdoutBuffer.length + 1);
          tmp.set(stdoutBuffer, 0);
          tmp[tmp.length - 1] = charCode;
          stdoutBuffer = tmp;
        }
      },
      // STDERR handler
      (charCode) => {
        if (charCode !== null && charCode !== undefined) {
          // Efficiently append to stderrBuffer
          const tmp = new Uint8Array(stderrBuffer.length + 1);
          tmp.set(stderrBuffer, 0);
          tmp[tmp.length - 1] = charCode;
          stderrBuffer = tmp;
        }
      }
    );
  },

  /**
   * Promise-based function to run a jq query.
   * Waits for runtimeInitPromise to resolve, ensuring the runtime is ready,
   * then calls rawImpl.
   *
   * @param {string} jsonString - The JSON input string.
   * @param {string} query - The jq filter string.
   * @param {string[]} [flags=[]] - Additional jq flags.
   * @returns {Promise<string>} - The raw jq output (trimmed).
   */
  raw(jsonString, query, flags = []) {
    return runtimeInitPromise.then(() => {
      return rawImpl(jsonString, query, flags);
    });
  },
};
