
var parsers = require('./parsers');

function compile(text) {
    var parser = parsers.createParser(text);
    
    var expr;
    var result = '';
    
    while (expr = parser.parse('Expression'))
        result += expr.value.compile() + ';';
        
    return result;
};

module.exports = {
    compile: compile
}