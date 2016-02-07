
var x = require('../lib/expressions');
var contexts = require('../lib/contexts');

exports['integer constant expression'] = function (test) {
    var result = x.constant(42);
    
    test.equal(result.evaluate(), 42);
    test.equal(result.compile(), "42");
};

exports['string constant expression'] = function (test) {
    var result = x.constant("foo");
    
    test.equal(result.evaluate(), "foo");
    test.equal(result.compile(), '"foo"');
};

exports['false name expression'] = function (test) {
    var result = x.name("false");
    
    test.equal(result.evaluate(), false);
    test.equal(result.compile(), "false");
};

exports['true name expression'] = function (test) {
    var result = x.name("true");
    
    test.equal(result.evaluate(), true);
    test.equal(result.compile(), "true");
};

exports['name expression'] = function (test) {
    var result = x.name("foo");
    var ctx = contexts.createContext();
    
    ctx.setLocalValue('foo', 42);
    
    test.equal(result.evaluate(ctx), 42);
    test.equal(result.compile(), "foo");
};

