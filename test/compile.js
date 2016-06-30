
var crjs = require('..');

function compile(text, expected, test) {
    var result = crjs.compile(text);
    test.ok(result);
    test.equal(result, expected);
};

exports['compile integer'] = function (test) {
    compile('42', '42;', test);
    compile('42\n\n', '42;', test);
};

exports['compile string'] = function (test) {
    compile('"foo"', '"foo";', test);
};

exports['compile booleans'] = function (test) {
    compile('false', 'false;', test);
    compile('true', 'true;', test);
};

exports['compile nil'] = function (test) {
    compile('nil', 'null;', test);
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
    compile('process "Hello, world"', 'process("Hello, world");', test);
};

exports['compile runtime call'] = function (test) {
    compile('puts "Hello, world"', 'var $crysjs = require("crysjs"); var puts = $crysjs.runtime.puts; puts("Hello, world");', test);
};

exports['compile def'] = function (test) {
    compile('def inc(a)\na+1\nend', 'function inc(a) { return a + 1; }', test);
};

exports['compile qualified call without arguments'] = function (test) {
    compile('foo.bar', 'foo.bar();', test);
};

exports['compile arithmetic expressions'] = function (test) {
    compile('1+2', '1 + 2;', test);
    compile('1-2', '1 - 2;', test);
    compile('3*2', '3 * 2;', test);
    compile('3/2', '3 / 2;', test);
    compile('1+2+3', '(1 + 2) + 3;', test);
    compile('1+2*3', '1 + (2 * 3);', test);
    compile('1/2+3', '(1 / 2) + 3;', test);
    compile('1/(2+3)', '1 / (2 + 3);', test);
};

exports['compile module expression'] = function (test) {
    compile('1%2', '1 % 2;', test);
};

exports['compile logical and expression'] = function (test) {
    compile('1 && 2', '1 && 2;', test);
};

exports['compile logical or expression'] = function (test) {
    compile('1 || 2', '1 || 2;', test);
};

exports['compile binary and expression'] = function (test) {
    compile('1 & 2', '1 & 2;', test);
};

exports['compile binary or expression'] = function (test) {
    compile('1 | 2', '1 | 2;', test);
};

exports['compile binary xor expression'] = function (test) {
    compile('1 | 2', '1 ^ 2;', test);
};

exports['compile comparison expressions'] = function (test) {
    compile('1<2', '1 < 2;', test);
    compile('1>2', '1 > 2;', test);
    compile('1<=2', '1 <= 2;', test);
    compile('1>=2', '1 >= 2;', test);
    compile('1+2<3', '(1 + 2) < 3;', test);
    compile('1>2+3', '1 > (2 + 3);', test);
};

exports['compile while expressions'] = function (test) {
    compile('while 1\na+1\nend', 'while (1) a + 1;', test);
    compile('while 1\na+1\nb+2\nend', 'while (1) { a + 1; b + 2; }', test);
    compile('while true\nputs 1\nend', 'var $crysjs = require("crysjs"); var puts = $crysjs.runtime.puts; while (true) puts(1);', test);
};

