const { Module } = require('module')

let STDIN = ''
let STDIN_BUFFER = []
let STDOUT_BUFFER = []
let STDERR_BUFFER = []

let isInitialized = false
const initListeners = []

const onInitialized = {
  addListener: function (cb) {
    if (isInitialized) {
      cb()
    }
    initListeners.push(cb)
  }
}

function toByteArray(str) {
  return Array.from(new TextEncoder('utf-8').encode(str))
}

function fromByteArray(data) {
  const array = new Uint8Array(data)
  return new TextDecoder().decode(array)
}

Module = Object.assign({}, Module, {
  noInitialRun: true,
  noExitRuntime: false,
  onRuntimeInitialized: function () {
    isInitialized = true
    initListeners.forEach(function (cb) {
      cb()
    })
  },
  preRun: function () {
    FS.init(
      function input() {
        if (STDIN_BUFFER.length) {
          return STDIN_BUFFER.pop()
        }

        if (!STDIN_BUFFER) return null
        STDIN_BUFFER = toByteArray(STDIN)
        STDIN = ''
        STDIN_BUFFER.push(null)
        STDIN_BUFFER.reverse()
        return STDIN_BUFFER.pop()
      },
      function output(c) {
        if (c) {
          STDOUT_BUFFER.push(c)
        }
      },
      function error(c) {
        if (c) {
          STDERR_BUFFER.push(c)
        }
      }
    )
  },
  raw: function () {
    const args = arguments
    return new Promise(function (resolve, reject) {
      onInitialized.addListener(function () {
        try {
          resolve(raw.apply(Module, args))
        } catch (e) {
          reject(e)
        }
      })
    })
  },
  json: function () {
    const args = arguments
    return new Promise(function (resolve, reject) {
      onInitialized.addListener(function () {
        try {
          resolve(json.apply(Module, args))
        } catch (e) {
          reject(e)
        }
      })
    })
  }
})

function raw(jsonstring, query, flags) {
  if (!isInitialized) return '{}'

  STDIN = jsonstring
  STDIN_BUFFER = []
  STDOUT_BUFFER = []
  STDERR_BUFFER = []

  flags = flags || []
  flags = flags.concat(['-M'])

  Module.callMain(flags.concat(query, '/dev/stdin')) // induce c main open it

  if (STDOUT_BUFFER.length) {
    return fromByteArray(STDOUT_BUFFER).trim()
  }

  if (STDERR_BUFFER.length) {
    const errString = fromByteArray(STDERR_BUFFER).trim()
    throw new Error(errString)
  }

  return ''
}

function json(json, query) {
  if (!isInitialized) return {}

  const jsonstring = JSON.stringify(json)
  const result = raw(jsonstring, query, ['-c']).trim()

  if (result.indexOf('\n') !== -1) {
    return result
      .split('\n')
      .filter(function (x) {
        return x
      })
      .reduce(function (acc, line) {
        return acc.concat(JSON.parse(line))
      }, [])
  } else {
    return JSON.parse(result)
  }
}
