type JSONValue = string | number | boolean | JSONObject | JSONArray;

interface JSONObject {
  [x: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> { }

export function raw(
  json: string,
  query: string,
  flags: Array<string>
): Promise<string>;

export function json(
  json: JSONValue,
  query: string
): Promise<JSONValue>;
