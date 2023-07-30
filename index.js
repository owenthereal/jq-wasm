const factory = require('./build/jq.js')

function raw(json, query, flags) {
    return new Promise(function (resolve, reject) {
        factory().then((instance) => {
            resolve(instance.raw(JSON.stringify(json), query, flags))
        }).catch((e) => {
            reject(e)
        })
    })
}

function json(json, query) {
    return new Promise(function (resolve, reject) {
        factory().then((instance) => {
            resolve(instance.json(json, query))
        }).catch((e) => {
            reject(e)
        })
    })
}

module.exports = {
    raw,
    json
}
