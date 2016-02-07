
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
    compile('a', 'var a; a;', test);
};

exports['compile assignment'] = function (test) {
    compile('a=1', 'var a; a = 1;', test);
};

exports['compile assignments'] = function (test) {
    compile('a=1\nb=a', 'var a; var b; a = 1; b = a;', test);
};

exports['compile assignments separated by carriage return'] = function (test) {
    compile('a=1\rb=a', 'var a; var b; a = 1; b = a;', test);
};

exports['compile assignments separated by carriage return line feed'] = function (test) {
    compile('a=1\r\nb=a\r\n', 'var a; var b; a = 1; b = a;', test);
};

exports['compile assignments separated by semi colon'] = function (test) {
    compile('a=1;b=a', 'var a; var b; a = 1; b = a;', test);
};

exports['compile call'] = function (test) {
    compile('puts "Hello, world"', 'puts("Hello, world");', test);
};

exports['compile def'] = function (test) {
    compile('def inc(a)\na+1\nend', 'function inc(a) { return a + 1; }', test);
};

exports['compile qualified call without arguments'] = function (test) {
    compile('foo.bar', 'foo.bar();', test);
};
