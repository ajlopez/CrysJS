
var parsers = require('./parsers');
var runtime = require('./runtime');
var x = require('./expressions');

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
        
    if (expr.getFunctionName) {
        var name = expr.getFunctionName();
        if (runtime[name])
            addName(names, name);
    }
    
    if (expr.getFunctionNames) {
        var fnnames = expr.getFunctionNames();
        
        fnnames.forEach(function (fnname) {
            if (runtime[fnname])
                addName(names, fnname);
        });
    }   
}

function compile(text, options) {
    options = options || { };
    
    if (!options.requirePath)
        options.requirePath = 'crysjs';
    
    var parser = parsers.createParser(text);
    
    var stmt;
    var result = '';
    var names = [];
    
    while (stmt = parser.parse('Statement')) {
        if (!stmt.value)
            continue;
            
        if (result.length)
            result += ' ';
            
        result += x.asStatement(stmt.value.compile());
        
        var ch = result[result.length - 1];
        
        if (ch !== ';' && ch !== '}')
            result += ';';
            
        addNames(names, stmt.value);
    }
    
    var rnames = '';
    var required = false;
    
    names.forEach(function (name) {
        if (runtime[name]) {
            if (!required) {
                rnames = 'var $crysjs = require("' + options.requirePath + '"); ' + rnames;
                required = true;
            }
            
            rnames += 'var ' + name + ' = $crysjs.runtime.' + name + '; ';
            
            return;
        }
        
        rnames += 'var ' + name + '; ';
    });
        
    return rnames + result;
};

module.exports = {
    compile: compile,
    runtime: runtime
}

