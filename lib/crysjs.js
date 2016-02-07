
var parsers = require('./parsers');

function compile(text) {
    var parser = parsers.createParser(text);
    
    var expr;
    var result = '';
    
    while (expr = parser.parse('Statement')) {
        if (result.length)
            result += ' ';
        result += expr.value.compile();
        
        var ch = result[result.length - 1];
        
        if (ch !== ';' && ch !== '}')
            result += ';';
    }
        
    return result;
};

module.exports = {
    compile: compile
}