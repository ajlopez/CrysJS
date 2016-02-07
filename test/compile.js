
var crjs = require('..');

function compile(text, expected, test) {
    var result = crjs.compile(text);
    test.ok(result);
    test.equal(result, expected);
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

exports['compile assignment'] = function (test) {
    compile('a=1', 'a = 1;', test);
};

exports['compile assignments'] = function (test) {
    compile('a=1\nb=a', 'a = 1; b = a;', test);
};

exports['compile assignments separated by carriage return'] = function (test) {
    compile('a=1\rb=a', 'a = 1; b = a;', test);
};

exports['compile assignments separated by carriage return line feed'] = function (test) {
    compile('a=1\r\nb=a\r\n', 'a = 1; b = a;', test);
};

exports['compile assignments separated by semi colon'] = function (test) {
    compile('a=1;b=a', 'a = 1; b = a;', test);
};

exports['compile call'] = function (test) {
    compile('puts "Hello, world"', 'puts("Hello, world");', test);
};

