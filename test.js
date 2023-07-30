var tape = require("tape");
var jq = require("./index.js");

tape("jq errors", function (t) {
    t.plan(3);

    jq.json({ foo: "bar", biz: 5 }, "[.foo, .biz] | ")
        .then(res => t.fail("Should not get here"))
        .catch(e => {
            t.equal(
                e.message,
                "jq: error: syntax error, unexpected end of file (Unix shell quoting issues?) at <top-level>, line 1:\n[.foo, .biz] |               \njq: 1 compile error",
                "jq compile error"
            )
        }
        );

    jq.json({ foo: 1 }, ".foo | .[]")
        .then(res => t.fail("Shouldn't get here"))
        .catch(e =>
            t.equal(
                e.message,
                "jq: error (at /dev/stdin:0): Cannot iterate over number (1)",
                "jq compile error"
            )
        );

    jq.json({ foo: 1 }, ".foo.bar")
        .then(res => t.fail("Shouldn't get here"))
        .catch(e =>
            t.equal(
                e.message,
                "jq: error (at /dev/stdin:0): Cannot index number with string \"bar\"",
                "jq compile error"
            )
        );
});

tape("jq valid", function (t) {
    t.plan(3);

    jq.json({ foo: "bar", biz: 5 }, "[.foo, .biz] | {res: .}")
        .then(res => {
            t.deepEquals(res, { res: ["bar", 5] }, "Passes single result case");
        })
        .catch(e => t.fail("Should not get here"));

    jq.json({ foo: [1, 2, 3] }, ".foo | .[]")
        .then(res => {
            t.deepEquals(res, [1, 2, 3], "Passes multi-result case");
        })
        .catch(e => t.fail("Should not get here"));

    jq.json({}, ".foo")
        .then(res => t.equal(res, null, "Nulls with empty json"))
        .catch(e => t.fail("Shouldn't get here"));
});
