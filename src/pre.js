/**
 * pre.js
 *
 * Injected by Emscripten via the --pre-js compile flag.
 * Responsibilities:
 *   - Manage STDIN/STDOUT/STDERR for jq
 *   - Wait for WebAssembly runtime initialization
 *   - Expose a promise-based 'raw' method returning { stdout, stderr, exitCode }
 *   - Suppress specific Emscripten warning messages
 *   - Ensure no state is accumulated between runs
 */

// Buffers for input and output
let stdinBuffer = new Uint8Array(0);
let stdoutBuffer = [];
let stderrBuffer = [];

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
 * Converts an array of char codes to a UTF-8 string.
 * @param {number[]} charCodes - Array of character codes.
 * @returns {string} - The decoded string.
 */
function fromCharCodes(charCodes) {
  return decoder.decode(new Uint8Array(charCodes));
}

/**
 * Runs jq and returns separate stdout and stderr as strings,
 * along with the exit code.
 *
 * @param {string} jsonString - The input JSON string.
 * @param {string} query - The jq filter string.
 * @param {string[]} flags - Additional jq flags.
 * @returns {{ stdout: string, stderr: string, exitCode: number }}
 */
function runJQ(jsonString, query, flags) {
  // Save the current stack state.
  const stackBefore = stackSave();

  // Save the current process.exitCode (even if 0) if process is available.
  const preExitCode = (typeof process !== "undefined") ? process.exitCode : undefined;

  // Reset buffers.
  stdinBuffer = toByteArray(jsonString);
  stdoutBuffer.length = 0;
  stderrBuffer.length = 0;

  // Force monochrome output to avoid ANSI escape sequences.
  if (!flags.includes('-M')) {
    flags = ['-M', ...flags];
  }

  let exitCode;
  try {
    // Execute jq using Module.callMain.
    exitCode = Module.callMain([...flags, query, '/dev/stdin']);
  } finally {
    // Restore process.exitCode if available: if preExitCode was undefined, set to 0.
    if (typeof process !== "undefined") {
      process.exitCode = preExitCode !== undefined ? preExitCode : 0;
    }
    // Restore the saved stack.
    stackRestore(stackBefore);
  }

  return {
    stdout: fromCharCodes(stdoutBuffer).trim(),
    stderr: fromCharCodes(stderrBuffer).trim(),
    exitCode,
  };
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
      // STDIN handler: returns the next byte or null if finished.
      () => {
        if (stdinBuffer.length === 0) return null;
        const byte = stdinBuffer[0];
        stdinBuffer = stdinBuffer.slice(1);
        return byte ?? null;
      },
      // STDOUT handler: collect each character code.
      (charCode) => {
        if (charCode != null) stdoutBuffer.push(charCode);
      },
      // STDERR handler: collect each character code.
      (charCode) => {
        if (charCode != null) stderrBuffer.push(charCode);
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
    return runtimeInitPromise.then(() => runJQ(jsonString, query, flags));
  },
};
