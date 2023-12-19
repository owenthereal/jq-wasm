type JSONValue = string | number | boolean | JSONObject | JSONArray;

interface JSONObject {
  [x: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> { }

function raw(
  json: object,
  query: string,
  flags: Array<string>
): Promise<string>;
function json(json: object, query: string): Promise<JSONValue>;

export = { raw, json };
