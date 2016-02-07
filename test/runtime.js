
var runtime = require('../lib/runtime');

exports['puts as function'] = function (test) {
    test.ok(runtime.puts);
    test.equal(typeof runtime.puts, 'function');
};