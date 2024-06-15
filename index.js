const runtime = require("./build/jq.js");

async function raw(json, query, flags = []) {
  if (typeof json !== 'string' || typeof query !== 'string') {
    throw new TypeError('Invalid arguments: json and query should be strings');
  }

  try {
    const instance = await runtime();
    return instance.raw(json, query, flags);
  } catch (error) {
    throw new Error(`Failed to execute raw query: ${error.message}`);
  }
}

async function json(json, query, flags = []) {
  if (typeof query !== 'string') {
    throw new TypeError('Invalid argument: query should be a string');
  }

  try {
    flags.push("-c");
    const result = await raw(JSON.stringify(json), query, flags);
    const trimmedResult = result.trim();

    if (trimmedResult.includes("\n")) {
      return trimmedResult
        .split("\n")
        .filter(Boolean)
        .map(JSON.parse);
    } else {
      return JSON.parse(trimmedResult);
    }
  } catch (error) {
    throw new Error(`Failed to execute JSON query: ${error.message}`);
  }
}

module.exports = {
  raw,
  json,
};
