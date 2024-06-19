let STDIN = '';
let STDIN_BUFFER = [];
let STDOUT_BUFFER = [];
let STDERR_BUFFER = [];

let isInitialized = false;
const initListeners = [];

const onInitialized = {
  addListener(cb) {
    if (isInitialized) {
      cb();
    } else {
      initListeners.push(cb);
    }
  }
};

const toByteArray = (str) => Array.from(new TextEncoder('utf-8').encode(str));

const fromByteArray = (data) => new TextDecoder().decode(new Uint8Array(data));

Module = {
  ...Module,
  noInitialRun: true,
  noExitRuntime: false,
  onRuntimeInitialized() {
    isInitialized = true;
    initListeners.forEach((cb) => cb());
  },
  preRun() {
    FS.init(
      function input() {
        if (STDIN_BUFFER.length) {
          return STDIN_BUFFER.pop();
        }

        if (!STDIN_BUFFER) return null;
        STDIN_BUFFER = toByteArray(STDIN);
        STDIN = '';
        STDIN_BUFFER.push(null);
        STDIN_BUFFER.reverse();
        return STDIN_BUFFER.pop();
      },
      function output(c) {
        if (c) {
          STDOUT_BUFFER.push(c);
        }
      },
      function error(c) {
        if (c) {
          STDERR_BUFFER.push(c);
        }
      }
    );
  },
  raw(...args) {
    return new Promise((resolve, reject) => {
      onInitialized.addListener(() => {
        try {
          resolve(raw.apply(Module, args));
        } catch (e) {
          reject(e);
        }
      });
    });
  },
};

function raw(jsonstring, query, flags = []) {
  if (!isInitialized) return '{}';

  STDIN = jsonstring;
  STDIN_BUFFER = [];
  STDOUT_BUFFER = [];
  STDERR_BUFFER = [];

  flags.push('-M');
  Module.callMain([...flags, query, '/dev/stdin']);

  if (STDOUT_BUFFER.length) {
    return fromByteArray(STDOUT_BUFFER).trim();
  }

  if (STDERR_BUFFER.length) {
    const errString = fromByteArray(STDERR_BUFFER).trim();
    throw new Error(errString);
  }

  return '';
}
