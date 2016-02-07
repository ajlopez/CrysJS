
var x = require('../lib/expressions');

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

