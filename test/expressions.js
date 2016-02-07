
var x = require('../lib/expressions');

exports['integer constant expression'] = function (test) {
    var result = x.constant(42);
    
    test.equal(result.evaluate(), 42);
};

exports['string constant expression'] = function (test) {
    var result = x.constant("foo");
    
    test.equal(result.evaluate(), "foo");
};

