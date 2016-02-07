
var parsers = require('./parsers');

function addName(names, name) {
    if (!name)
        return;
        
    if (names.indexOf(name) >= 0)
        return;
        
    names.push(name);
};

function addNames(names, expr) {
    if (expr.getName)
        addName(names, expr.getName());
}

function compile(text) {
    var parser = parsers.createParser(text);
    
    var stmt;
    var result = '';
    var names = [];
    
    while (stmt = parser.parse('Statement')) {
        if (result.length)
            result += ' ';
            
        result += stmt.value.compile();
        
        var ch = result[result.length - 1];
        
        if (ch !== ';' && ch !== '}')
            result += ';';
            
        addNames(names, stmt.value);
    }
    
    var rnames = '';
    
    names.forEach(function (name) {
        rnames += 'var ' + name + '; ';
    });
        
    return rnames + result;
};

module.exports = {
    compile: compile
}

