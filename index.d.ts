type JSONValue = string | number | boolean | JSONObject | JSONArray | null;

interface JSONObject {
  [x: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> { }

export function raw(
  json: string,
  query: string,
  flags?: Array<string>
): Promise<string>;

export function json(
  json: JSONValue,
  query: string,
  flags?: Array<string>
): Promise<JSONValue>;
