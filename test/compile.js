
var crjs = require('..');

function compile(text, expected, test) {
    var result = crjs.compile(text);
    test.ok(result);
    test.equal(result.expected);
};

exports['compile integer'] = function (test) {
    compile('42', '42;', test);
};

exports['compile string'] = function (test) {
    compile('"foo"', '"foo";', test);
};

exports['compile name'] = function (test) {
    compile('a', 'a;', test);
};