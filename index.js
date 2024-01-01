const runtime = require("./build/jq.js");

function raw(jsonString, query, flags) {
  return new Promise(function (resolve, reject) {
    runtime()
      .then((instance) => {
        return resolve(instance.raw(jsonString, query, flags));
      })
      .catch((e) => {
        reject(e);
      });
  });
}

function json(json, query) {
  return new Promise(function (resolve, reject) {
    raw(JSON.stringify(json), query, ["-c"])
      .then((result) => {
        result = result.trim();
        if (result.indexOf("\n") !== -1) {
          return resolve(
            result
              .split("\n")
              .filter(function (x) {
                return x;
              })
              .reduce(function (acc, line) {
                return acc.concat(JSON.parse(line));
              }, [])
          );
        } else {
          return resolve(JSON.parse(result));
        }
      })
      .catch((e) => {
        reject(e);
      });
  });
}

module.exports = {
  raw,
  json,
};
