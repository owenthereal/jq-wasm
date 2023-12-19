const runtime = require("../build/jq.js");

function raw(json, query, flags) {
  return new Promise(function (resolve, reject) {
    runtime()
      .then((instance) => {
        resolve(instance.raw(JSON.stringify(json), query, flags));
        return null;
      })
      .catch((e) => {
        reject(e);
      });
  });
}

function json(json, query) {
  return new Promise(function (resolve, reject) {
    raw(json, query, ["-c"])
      .then((result) => {
        result = result.trim();
        if (result.indexOf("\n") !== -1) {
          resolve(
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
          resolve(JSON.parse(result));
        }
        return null;
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
