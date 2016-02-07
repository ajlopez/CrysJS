
var crjs = require('..');

exports['compile integer'] = function (test) {
    var result = crjs.compile('42');
    
    test.ok(result);
    test.equal(result, '42;');
};