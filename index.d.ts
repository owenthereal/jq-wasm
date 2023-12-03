type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | JSONArray;

interface JSONObject {
    [x: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> { }

function raw(json: {}, query: string, flags: Array<string>): Promise<string>
function json(json: {}, query: string): Promise<JSONValue>

export = { raw, json }
