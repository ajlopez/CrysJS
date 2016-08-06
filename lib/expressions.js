
var contexts = require('./contexts');

var methods = {
    number: {
        to_s: function () { return this.toString(); }
    },
    string: {
        to_i: function () { return parseInt(this); }
    }
};

function compileExpression(expr, context) {
    if (expr instanceof ConstantExpression || expr instanceof NameExpression)
        return expr.compile(context);
    
    var code = expr.compile(context);
    
    if (code[0] === '(')
        return code;
        
    return '(' + code + ')';
}

function asStatement(text) {
    if (text[0] === '(' && text[text.length - 1] === ')')
        return text.substring(1, text.length - 1);
        
    return text;
}

function isFalse(value) {
    return value === null || value === false || value === undefined;
}

function getInstanceMethod(obj, fnname) {
    return methods[typeof obj][fnname];
}

function ClassClass(cls) {
    var instanceMethods = {
        'new': function () {
            var newobj = new Object();
            newobj.$class = cls;
            
            var initialize = cls.getInstanceMethod('initialize');
            
            if (initialize)
                initialize.apply(newobj, arguments);
            
            return newobj;
        }
    };
    
    this.getInstanceMethod = function (name) {
        return instanceMethods[name];
    };
    
    this.setInstanceMethod = function (name, method) {
        instanceMethods[name] = method;
    };
}

function ModuleClass(cls) {
    var instanceMethods = { };
    
    this.getInstanceMethod = function (name) {
        return instanceMethods[name];
    };
}

function Class(name, superclass) {
    var instanceMethods = { };
    
    this.$class = new ClassClass(this);
    this.$superclass = superclass;
    this.$constants = contexts.createContext();
    
    this.getName = function () { return name; };
    
    this.getInstanceMethod = function (name) {
        var method = instanceMethods[name];
        
        if (!method && this.$superclass)
            return this.$superclass.getInstanceMethod(name);
            
        return method;
    };
    
    this.setInstanceMethod = function (name, method) {
        instanceMethods[name] = method;
    }
    
    this.getClassMethod = function (name) {
        return this.$class.getInstanceMethod(name);
    }
    
    this.setClassMethod = function (name, method) {
        this.$class.setInstanceMethod(name, method);
    }
}

function Module(name) {
    var instanceMethods = { };
    
    this.$class = new ModuleClass(this);
    this.$constants = contexts.createContext();
    
    this.getName = function () { return name; };
    
    this.getInstanceMethod = function (name) {
        return instanceMethods[name];
    };
    
    this.setInstanceMethod = function (name, method) {
        instanceMethods[name] = method;
    }
}

function ClassExpression(name, supername, expr) {
    if (!expr) {
        expr = supername;
        supername = null;
    }
    
    this.getName = function () { return name; }
    
    this.getSuperName = function () { return supername; }
    
    this.evaluate = function (context) {
        var supercls = null;
        
        if (supername)
            supercls = context.getValue(supername);
            
        var cls = new Class(name, supercls);
        var newcontext = contexts.createContext(context);
        newcontext.$module = cls;
        newcontext.setLocalValue("self", cls.$class);
        expr.evaluate(newcontext);
        context.setLocalValue(name, cls);
        return cls;
    }
}

function ModuleExpression(name, expr) {
    this.getName = function () { return name; }
    
    this.evaluate = function (context) {
        var mod = new Module(name);
        var newcontext = contexts.createContext(context);
        newcontext.$module = mod;
        expr.evaluate(newcontext);
        context.setLocalValue(name, mod);
        return mod;
    }
}

function JavaScriptNamespaceExpression() {
    var value;

    if (typeof global != 'undefined')
        value = global;
    else if (typeof window != 'undefined')
        value = window;
        
    this.evaluate = function (context) {
        return value;
    }
}

function JavaScriptQualifiedNameExpression(expr, name) {
    this.evaluate = function (context) {
        return expr.evaluate(context)[name];
    }
    
    this.getExpression = function () { return expr; }
    
    this.getName = function () { return name; }
}

function JavaScriptCallExpression(expr, exprs) {
    this.evaluate = function (context) {
        var obj = expr.getExpression().evaluate(context);
        var name = expr.getName();
        var args = [];
        
        exprs.forEach(function (expr) {
            args.push(expr.evaluate(context));
        });
        
        return obj[name].apply(obj, args);
    }
}

function DefExpression(name, parnames, expr) {
    this.evaluate = function (context) {
        var fun = function() { 
            var newcontext = contexts.createContext(context);
            newcontext.$self = this;
            for (n in parnames)
                newcontext.setLocalValue(parnames[n], arguments[n]);
            return expr.evaluate(newcontext); 
        };
        if (context.$module)
            context.$module.setInstanceMethod(name, fun);
        else
            context.setLocalValue(name, fun);
        return fun;
    }
    
    this.compile = function (context) {
        var result = 'function ' + name + '(';
        var counter = 0;
        
        parnames.forEach(function (parname) {
            if (counter)
                result += ', ';
                
            result += parname;
            counter++;
        });
        
        result += ')';
        
        if (expr instanceof CompositeExpression)
            result += ' ' + expr.compile(context, true);
        else
            result += ' { return ' + expr.compile(context) + ' }';
            
        return result;
    }
}

function createDefExpression(name, parnames, expr) {
    return new DefExpression(name, parnames, expr);
}

function DefNamedExpression(clsname, name, parnames, expr) {
    this.evaluate = function (context) {
        var fun = function() { 
            var newcontext = contexts.createContext(context);
            newcontext.$self = this;
            for (n in parnames)
                newcontext.setLocalValue(parnames[n], arguments[n]);
            return expr.evaluate(newcontext); 
        };
        
        var cls = context.getValue(clsname);
        cls.setInstanceMethod(name, fun);

        return fun;
    }
}

function CallExpression(name, exprs) {
    this.evaluate = function (context) {
        var fun = context.getValue(name);
        var args = [];
        
        exprs.forEach(function (expr) {
            args.push(expr.evaluate(context));
        });
        
        return fun.apply(null, args);
    }
    
    this.compile = function (context) {
        var result = name + '(';
        var counter = 0;
        
        exprs.forEach(function (expr) {
            if (counter)
                result += ', ';
                
            result += expr.compile(context);
            
            counter++;
        });
        
        result += ')';
        
        return result;
    };
    
    this.getFunctionName = function () { return name; }
}

function ArrayExpression(exprs) {
    this.evaluate = function (context) {
        var array = [];
        
        exprs.forEach(function (expr) {
            array.push(expr.evaluate(context));
        });
        
        return array;
    }
    
    this.compile = function (context) {
        var result = '([';
        
        var nexpr = 0;
        
        exprs.forEach(function (expr) {
            if (nexpr)
                result += ', ';
            
            result += expr.compile(context);
            nexpr++;
        });

        result += '])';
        
        return result;
    }
}

function IndexedExpression(expr, exprs) {
    this.evaluate = function (context) {
        var value = expr.evaluate(context);
                
        exprs.forEach(function (expr) {
            value = value[expr.evaluate(context)];
        });
        
        return value;
    }
    
    this.compile = function (context) {
        var result = '(' + expr.compile(context) + '['; 
        var nexpr = 0;
        
        exprs.forEach(function (expr) {
            if (nexpr++)
                result += ', ';
                
            result += expr.compile(context);
        });
        
        return result + '])';
    }
}

function MakeQualifiedCallExpression(expr, exprs) {
    if (exprs == null && (expr instanceof JavaScriptQualifiedNameExpression || expr instanceof JavaScriptNamespaceExpression))
        return expr;
        
    if (exprs == null)
        exprs = [];
        
    if (expr instanceof JavaScriptQualifiedNameExpression || expr instanceof JavaScriptNamespaceExpression)
        return new JavaScriptCallExpression(expr, exprs);

    return new QualifiedCallExpression(expr, exprs);
}

function QualifiedCallExpression(expr, exprs) {
    this.evaluate = function (context) {
        var obj = expr.getTarget().evaluate(context);
        var fun;
        var fnname = expr.getName();
        
        if (obj.$class)
            fun = obj.$class.getInstanceMethod(fnname);
        else
            fun = getInstanceMethod(obj, fnname);
        
        var args = [];
        
        exprs.forEach(function (expr) {
            args.push(expr.evaluate(context));
        });
        
        return fun.apply(obj, args);
    }
    
    this.compile = function (context) {
        var result = expr.compile(context);
        result += '(';
        var counter = 0;
        
        exprs.forEach(function (expr) {
            if (counter)
                result += ', ';
            result += expr.compile(context);
        });
        
        result += ')';
        
        return result;
    }
}

function IfExpression(condition, thenexpr, elseexpr) {
    this.evaluate = function (context) {
        var value = condition.evaluate(context);
        
        if (isFalse(value))
            if (elseexpr)
                return elseexpr.evaluate(context);
            else
                return null;
            
        return thenexpr.evaluate(context);
    };
}

function UnlessExpression(condition, thenexpr, elseexpr) {
    this.evaluate = function (context) {
        var value = condition.evaluate(context);
        
        if (!isFalse(value))
            if (elseexpr)
                return elseexpr.evaluate(context);
            else
                return null;
            
        return thenexpr.evaluate(context);
    };
}

function WhileExpression(condition, expr) {
    this.evaluate = function (context) {
        while (true) {
            var value = condition.evaluate(context);
        
            if (isFalse(value))
                return null;
            
            expr.evaluate(context);
        }
    };
    
    this.compile = function (context) {
        return 'while (' + asStatement(condition.compile(context)) + ') ' + expr.compile(context);
    };
    
    this.getFunctionNames = function (context) {
        var fnnames = [];
        
        if (condition.getFunctionName)
            fnnames.push(condition.getFunctionName());
            
        if (expr.getFunctionName)
            fnnames.push(expr.getFunctionName());
            
        if (expr.getFunctionNames)
            fnnames = fnnames.concat(expr.getFunctionNames());
        
        return fnnames;
    }
}

function UntilExpression(condition, expr) {
    this.evaluate = function (context) {
        while (true) {
            var value = condition.evaluate(context);
        
            if (!isFalse(value))
                return null;
            
            expr.evaluate(context);
        }
    };
}

function CompositeExpression(exprs) {
    this.evaluate = function (context) {
        var result = null;
        
        exprs.forEach(function (expr) {
            result = expr.evaluate(context);
        });
        
        return result;
    };
    
    this.compile = function (context, useret) {
        var result = exprs.length > 1 || useret ? '{ ' : '';
        var counter = 0;
        
        exprs.forEach(function (expr) {
            if (counter)
                result += ' ';
                
            if (useret && counter === exprs.length - 1)
                result += 'return ';
                
            result += asStatement(expr.compile(context)) + ';';
            
            counter++;
        });
        
        if (exprs.length > 1 || useret)
            result += ' }';
        
        return result;
    };
    
    this.getFunctionNames = function () {
        var fnnames = [];
        
        exprs.forEach(function (expr) {
            if (expr.getFunctionName)
                fnnames.push(expr.getFunctionName());
                
            if (expr.getFunctionNames)
                fnnames = fnnames.concat(expr.getFunctionNames());
        });
        
        return fnnames;
    };
}

function AssignmentExpression(leftvalue, expr) {
    this.evaluate = function (context) {
        var value = expr.evaluate(context);
        leftvalue.setValue(context, value);
        return value;
    };
    
    this.compile = function (context) {
        return leftvalue.compile(context) + ' = ' + asStatement(expr.compile());
    };
    
    this.getName = function () {
        if (leftvalue.getName)
            return leftvalue.getName();
            
        return null; 
    };
}

function MakeQualifiedNameExpression(target, name) {
    if (target instanceof JavaScriptNamespaceExpression ||
        target instanceof JavaScriptQualifiedNameExpression)
        return new JavaScriptQualifiedNameExpression(target, name);

    return new QualifiedNameExpression(target, name);
}

function QualifiedNameExpression(target, name) {
    this.evaluate = function (context) {
        var obj = target.evaluate(context);
        
        if (obj.$class)
            return obj.$class.getInstanceMethod(name);
        
        return obj[name];
    };
    
    this.getName = function () { return name; };
    
    this.getTarget = function () { return target; };
    
    this.compile = function (context) {
        return target.compile() + '.' + name;
    };
}

function makeNameExpression(name) {
    if (name == 'false')
        return new ConstantExpression(false);

    if (name == 'true')
        return new ConstantExpression(true);

    if (name == 'nil')
        return new ConstantExpression(null);

    if (name == 'js')
        return new JavaScriptNamespaceExpression();

    return new NameExpression(name);
}

function InstanceVariableExpression(name) {
    this.evaluate = function (context) {
        if (!context.$self.$vars)
            return null;
            
        return context.$self.$vars[name];
    };
    
    this.getName = function () { return name; };
    
    this.setValue = function (context, value) {
        if (!context.$self.$vars)
            context.$self.$vars = { };
                    
        context.$self.$vars[name] = value;
    }
}

function ClassVariableExpression(name) {
    this.evaluate = function (context) {
        if (!context.$self.$class.$vars)
            return null;
            
        return context.$self.$class.$vars[name];
    };
    
    this.getName = function () { return name; };
    
    this.setValue = function (context, value) {
        if (!context.$self.$class.$vars)
            context.$self.$class.$vars = { };
            
        context.$self.$class.$vars[name] = value;
    }
}

function GlobalVariableExpression(name) {
    this.getName = function () { return name; };
}

function NameExpression(name) {
    this.evaluate = function (context) {
        var value = context.getValue(name);
        
        if (typeof value == 'function')
            return value();
        
        return value;
    };
    
    this.compile = function (context) {
        return name;
    };
    
    this.getName = function () { return name; };
    
    this.setValue = function (context, value) {
        context.setLocalValue(name, value);
    }
}

function KeywordExpression(name) {
    this.evaluate = function (context) {
        return name;
    };
    
    this.compile = function (context) {
        return '(' + JSON.stringify(name) + ')';
    }
}

function ConstantExpression(value) {
    this.evaluate = function () {
        return value;
    };
    
    this.compile = function () {
        return JSON.stringify(value);
    };
}

function EqualExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) == right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + compileExpression(left, context) + ' == ' + compileExpression(right, context) + ')';
    };
}

function NotEqualExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) != right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + compileExpression(left, context) + ' != ' + compileExpression(right, context) + ')';
    };
}

function LessExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) < right.evaluate(context);
    };
    
    this.compile = function (context) {
        return compileExpression(left, context) + ' < ' + compileExpression(right, context);
    };
}

function GreaterExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) > right.evaluate(context);
    };
    
    this.compile = function (context) {
        return compileExpression(left, context) + ' > ' + compileExpression(right, context);
    };
}

function LessEqualExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) <= right.evaluate(context);
    };
    
    this.compile = function (context) {
        return compileExpression(left, context) + ' <= ' + compileExpression(right, context);
    };
}

function LessEqualGreaterExpression(left, right) {
    this.evaluate = function (context) {
        var vleft = left.evaluate(context);
        var vright = right.evaluate(context);
        
        if (vleft < vright)
            return -1;
        if (vleft > vright)
            return 1;
        return 0;
    };
}

function GreaterEqualExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) >= right.evaluate(context);
    };
    
    this.compile = function (context) {
        return compileExpression(left, context) + ' >= ' + compileExpression(right, context);
    };
}

function AddExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) + right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' + ' + right.compile(context) + ')';
    };
}

function SubtractExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) - right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' - ' + right.compile(context) + ')';
    };
}

function MultiplyExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) * right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' * ' + right.compile(context) + ')';
    };
}

function DivideExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) / right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' / ' + right.compile(context) + ')';
    };
}

function ModulusExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) % right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' % ' + right.compile(context) + ')';
    };
}

function PowerExpression(left, right) {
    this.evaluate = function (context) {
        return Math.pow(left.evaluate(context), right.evaluate(context));
    };
    
    this.compile = function (context) {
        return '(Math.pow(' + left.compile(context) + ', ' + right.compile(context) + '))';
    };
}

function LogicalAndExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) && right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' && ' + right.compile(context) + ')';
    };
}

function LogicalOrExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) || right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' || ' + right.compile(context) + ')';
    };
}

function BinaryAndExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) & right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' & ' + right.compile(context) + ')';
    };
}

function BinaryOrExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) | right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' | ' + right.compile(context) + ')';
    };
}

function BinaryXorExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) ^ right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' ^ ' + right.compile(context) + ')';
    };
}

function BinaryLeftShiftExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) << right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' << ' + right.compile(context) + ')';
    };
}

function BinaryRightShiftExpression(left, right) {
    this.evaluate = function (context) {
        return left.evaluate(context) >> right.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(' + left.compile(context) + ' >> ' + right.compile(context) + ')';
    };
}

function BinaryNotExpression(expr) {
    this.evaluate = function (context) {
        return ~expr.evaluate(context);
    };
    
    this.compile = function (context) {
        return '(~' + expr.compile(context) + ')';
    };
}

function makeBinaryExpression(klass) {
    return function (left, right) {
        return new klass(left, right);
    };
}

function makeUnaryExpression(klass) {
    return function (value) {
        return new klass(value);
    };
}

module.exports = {
    klass: function (name, supername, expr) { return new ClassExpression(name, supername, expr); },
    module: makeBinaryExpression(ModuleExpression),
    def: createDefExpression,
    defnamed: function (clsname, name, parnames, expr) { new DefNamedExpression(clsname, name, parnames, expr); },
    call: makeBinaryExpression(CallExpression),
    array: makeUnaryExpression(ArrayExpression),
    indexed: makeBinaryExpression(IndexedExpression),
    qualifiedcall: makeBinaryExpression(MakeQualifiedCallExpression),
    if: function (condexpr, thenexpr, elseexpr) { return new IfExpression(condexpr, thenexpr, elseexpr); },
    unless: function (condexpr, thenexpr, elseexpr) { return new UnlessExpression(condexpr, thenexpr, elseexpr); },
    while: makeBinaryExpression(WhileExpression),
    until: makeBinaryExpression(UntilExpression),
    composite: makeUnaryExpression(CompositeExpression),
    assign: makeBinaryExpression(AssignmentExpression),
    qualifiedname: makeBinaryExpression(MakeQualifiedNameExpression),
    name: makeNameExpression,
    keyword: makeUnaryExpression(KeywordExpression),
    instancevar: makeUnaryExpression(InstanceVariableExpression),
    classvar: makeUnaryExpression(ClassVariableExpression),
    globalvar: makeUnaryExpression(GlobalVariableExpression),
    constant: makeUnaryExpression(ConstantExpression),
    eq: makeBinaryExpression(EqualExpression),
    noteq: makeBinaryExpression(NotEqualExpression),
    less: makeBinaryExpression(LessExpression),
    greater: makeBinaryExpression(GreaterExpression),
    lesseq: makeBinaryExpression(LessEqualExpression),
    lteqgt: makeBinaryExpression(LessEqualGreaterExpression),
    greatereq: makeBinaryExpression(GreaterEqualExpression),
    add: makeBinaryExpression(AddExpression),
    subtract: makeBinaryExpression(SubtractExpression),
    multiply: makeBinaryExpression(MultiplyExpression),
    divide: makeBinaryExpression(DivideExpression),
    mod: makeBinaryExpression(ModulusExpression),
    power: makeBinaryExpression(PowerExpression),
    band: makeBinaryExpression(BinaryAndExpression),
    bor: makeBinaryExpression(BinaryOrExpression),
    bxor: makeBinaryExpression(BinaryXorExpression),
    bnot: makeUnaryExpression(BinaryNotExpression),
    lshift: makeBinaryExpression(BinaryLeftShiftExpression),
    rshift: makeBinaryExpression(BinaryRightShiftExpression),
    and: makeBinaryExpression(LogicalAndExpression),
    or: makeBinaryExpression(LogicalOrExpression),
    
    asStatement: asStatement
};

