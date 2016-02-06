
var simplegrammar = require('simplegrammar');
var expressions = require('./expressions');

var get = simplegrammar.get;
var peek = simplegrammar.peek;

var ClassExpression = expressions.ClassExpression,
    ModuleExpression = expressions.ModuleExpression,
    JavaScriptNamespaceExpression = expressions.JavaScriptNamespaceExpression,
    JavaScriptQualifiedNameExpression = expressions.JavaScriptQualifiedNameExpression,
    DefExpression = expressions.DefExpression,
    DefNamedExpression = expressions.DefNamedExpression,
    CallExpression = expressions.CallExpression,
    ArrayExpression = expressions.ArrayExpression,
    IndexedExpression = expressions.IndexedExpression,
    MakeQualifiedCallExpression = expressions.MakeQualifiedCallExpression,
    QualifiedCallExpression = expressions.QualifiedCallExpression,
    IfExpression = expressions.IfExpression,
    UnlessExpression = expressions.UnlessExpression,
    WhileExpression = expressions.WhileExpression,
    UntilExpression = expressions.UntilExpression,
    CompositeExpression = expressions.CompositeExpression,
    AssignmentExpression = expressions.AssignmentExpression,
    MakeQualifiedNameExpression = expressions.MakeQualifiedNameExpression,
    QualifiedNameExpression = expressions.QualifiedNameExpression,
    MakeNameExpression = expressions.MakeNameExpression,
    KeywordExpression = expressions.KeywordExpression,
    InstanceVariableExpression = expressions.InstanceVariableExpression,
    ClassVariableExpression = expressions.ClassVariableExpression,
    NameExpression = expressions.NameExpression,
    ConstantExpression = expressions.ConstantExpression,
    EqualExpression = expressions.EqualExpression,
    NotEqualExpression = expressions.NotEqualExpression,
    LessExpression = expressions.LessExpression,
    GreaterExpression = expressions.GreaterExpression,
    LessEqualExpression = expressions.LessEqualExpression,
    LessEqualGreaterExpression = expressions.LessEqualGreaterExpression,
    GreaterEqualExpression = expressions.GreaterEqualExpression,
    AddExpression = expressions.AddExpression,
    SubtractExpression = expressions.SubtractExpression,
    MultiplyExpression = expressions.MultiplyExpression,
    DivideExpression = expressions.DivideExpression,
    ModulusExpression = expressions.ModulusExpression,
    PowerExpression = expressions.PowerExpression,
    BinaryAndExpression = expressions.BinaryAndExpression,
    BinaryOrExpression = expressions.BinaryOrExpression,
    BinaryXorExpression = expressions.BinaryXorExpression,
    BinaryNotExpression = expressions.BinaryNotExpression,
    BinaryLeftShiftExpression = expressions.BinaryLeftShiftExpression,
    BinaryRightShiftExpression = expressions.BinaryRightShiftExpression,
    LogicalAndExpression = expressions.LogicalAndExpression,
    LogicalOrExpression = expressions.LogicalOrExpression;

// escape character function

function escape(ch) {
    if (ch === 't')
        return '\t';
    if (ch === 'r')
        return '\r';
    if (ch === 'n')
        return '\n';

    return ch;
}

var rules = [
    get([' ','\t','\r']).oneOrMore().skip(),
    get('#').upTo('\n').skip(),
    get('"').upTo('"', '\\', escape).generate('String', function (value) { return new ConstantExpression(value.substring(1, value.length - 1)); }),
    get(get('0-9').oneOrMore(), '.', get('0-9').oneOrMore()).generate('Real', function (value) { return new ConstantExpression(parseFloat(value)) }),
    get('0-9').oneOrMore().generate('Integer', function (value) { return new ConstantExpression(parseInt(value)) }),
    get(['a-z', 'A-Z', '_'], get(['a-z', 'A-Z', '0-9', '_']).zeroOrMore()).generate('Name', function (value) { return MakeNameExpression(value) }),
    get(':', ['a-z', 'A-Z', '_'], get(['a-z', 'A-Z', '0-9', '_']).zeroOrMore()).generate('Keyword', function (value) { return new KeywordExpression(value) }),
    
    // Operators
    get('+').generate('Plus'),
    get('-').generate('Minus'),
    get('**').generate('Power'),
    get('*').generate('Multiply'),
    get('/').generate('Divide'),
    get('%').generate('Modulus'),
    get('==').generate('Equal'),
    get('!=').generate('NotEqual'),
    get('<=>').generate('LessEqualGreater'),
    get('<=').generate('LessEqual'),
    get('<<').generate('BinaryLeftShift'),
    get('<').generate('Less'),
    get('>=').generate('GreaterEqual'),
    get('>>').generate('BinaryRightShift'),
    get('>').generate('Greater'),
    get('=').generate('Assign'),
    get('&&').generate('LogicalAnd'),
    get('||').generate('LogicalOr'),
    get('&').generate('BinaryAnd'),
    get('|').generate('BinaryOr'),
    get('^').generate('BinaryXor'),
    get('~').generate('BinaryNot'),
    
    // Punctuation
    get('(').generate('LeftParenthesis'),
    get(')').generate('RightParenthesis'),
    get('[').generate('LeftBracket'),
    get(']').generate('RightBracket'),
    get(',').generate('Comma'),
    get('.').generate('Dot'),
    
    // Program
    
    get('StatementList').generate('Program', function (value) { return new CompositeExpression(value); }),
    get('StatementList', 'Statement').generate('StatementList', function (values) { if (values[1] == null) return values[0]; var list = values[0]; list.push(values[1]); return list; }),
    get('Statement').generate('StatementList', function (value) { if (value == null) return []; return [value]; }),
    
    // Class
    
    get('class', 'Name', 'Less', 'Name', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new ClassExpression(values[1].getName(), values[3].getName(), new CompositeExpression(values[5])); }),
    get('class', 'Name', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new ClassExpression(values[1].getName(), new CompositeExpression(values[3])); }),

    // Module
    
    get('module', 'Name', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new ModuleExpression(values[1].getName(), new CompositeExpression(values[3])); }),
    
    // Def
    get('def', 'Name', 'Dot', 'Name', 'LeftParenthesis', 'RightParenthesis', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new DefNamedExpression(values[1].getName(), values[3].getName(), [], new CompositeExpression(values[7])); }),
    get('def', 'Name', 'Dot', 'Name', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new DefNamedExpression(values[1].getName(), values[3].getName(), [], new CompositeExpression(values[5])); }),
    get('def', 'Name', 'LeftParenthesis', 'RightParenthesis', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new DefExpression(values[1].getName(), [], new CompositeExpression(values[5])); }),
    get('def', 'Name', 'LeftParenthesis', 'NameList', 'RightParenthesis', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new DefExpression(values[1].getName(), values[3], new CompositeExpression(values[6])); }),
    get('def', 'Name', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new DefExpression(values[1].getName(), [], new CompositeExpression(values[3])); }),

    get('Name', 'Comma', 'NameList').generate('NameList', function (values) { var list = values[2]; list.unshift(values[0].getName()); return list; }),
    get('Name', peek('RightParenthesis')).generate('NameList', function (values) { return [values[0].getName()]; }),
    
    // If, Unless and Suite
    get('if', 'Expression', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new IfExpression(values[1], new CompositeExpression(values[3])); }),
    get('if', 'Expression', 'EndOfStatement', 'Suite', 'else', 'Suite', 'end').generate('Expression', function (values) { return new IfExpression(values[1], new CompositeExpression(values[3]), new CompositeExpression(values[5])); }),
    get('unless', 'Expression', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new UnlessExpression(values[1], new CompositeExpression(values[3])); }),
    get('unless', 'Expression', 'EndOfStatement', 'Suite', 'else', 'Suite', 'end').generate('Expression', function (values) { return new UnlessExpression(values[1], new CompositeExpression(values[3]), new CompositeExpression(values[5])); }),
    peek('end').generate('Suite', function (values) { return []; }),
    peek('else').generate('Suite', function (values) { return []; }),
    get('Statement', 'Suite').generate('Suite', function (values) { if (values[0] == null) return values[1]; var vals = values[1]; vals.unshift(values[0]); return vals; }),
    get('Expression', 'unless', 'Expression').generate('Expression', function (values) { return new UnlessExpression(values[2], values[0]); }),
    //get('Expression', 'Suite').generate('Suite', function (values) { var vals = values[1]; vals.unshift(values[0]); return vals; }),
    
    // While and Suite
    get('while', 'Expression', 'do', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new WhileExpression(values[1], new CompositeExpression(values[4])); }),
    get('while', 'Expression', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new WhileExpression(values[1], new CompositeExpression(values[3])); }),
    
    // Until and Suite
    get('until', 'Expression', 'do', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new UntilExpression(values[1], new CompositeExpression(values[4])); }),
    get('until', 'Expression', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new UntilExpression(values[1], new CompositeExpression(values[3])); }),

    // Begin to End
    get('begin', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return new CompositeExpression(values[2]); }),

    // Call
//    get('Call').generate('Term'),
    get('Name', 'LeftBracket', 'ExpressionList', 'RightBracket').generate('Term', function (values) { return new IndexedExpression(values[0], values[2]); }),
    get('Name', 'ExpressionList').generate('Term', function (values) { return new CallExpression(values[0].getName(), values[1]); }),
    get('Name', 'LeftParenthesis', 'ExpressionList', 'RightParenthesis').generate('Term', function (values) { return new CallExpression(values[0].getName(), values[2]); }),
    get('Name', 'LeftParenthesis', 'RightParenthesis').generate('Term', function (values) { return new CallExpression(values[0].getName(), []); }),
        
    // Assignment
    get('Name', 'Assign', 'Expression').generate('Expression', function (values) { return new AssignmentExpression(values[0], values[2]); }),
    get('InstanceVariable', 'Assign', 'Expression').generate('Expression', function (values) { return new AssignmentExpression(values[0], values[2]); }),
    get('ClassVariable', 'Assign', 'Expression').generate('Expression', function (values) { return new AssignmentExpression(values[0], values[2]); }),
    
    // Qualified Call
    get('QualifiedCall').generate('Term'),
    get('QualifiedName', 'ExpressionList').generate('QualifiedCall', function (values) { return MakeQualifiedCallExpression(values[0], values[1]); }),
    get('QualifiedName', 'LeftParenthesis', 'ExpressionList', 'RightParenthesis').generate('QualifiedCall', function (values) { return MakeQualifiedCallExpression(values[0], values[2]); }),
    get('QualifiedName', 'LeftParenthesis', 'RightParenthesis').generate('QualifiedCall', function (values) { return MakeQualifiedCallExpression(values[0], []); }),
    get('QualifiedName').generate('QualifiedCall', function (value) { return MakeQualifiedCallExpression(value, null); }),
    
    // Qualified Name
    get('QualifiedName', 'Dot', 'Name').generate('QualifiedName', function (values) { return MakeQualifiedNameExpression(values[0], values[2].getName()); }),
    get('Name', 'Dot', 'Name').generate('QualifiedName', function (values) { return MakeQualifiedNameExpression(values[0], values[2].getName()); }),
    get('Integer', 'Dot', 'Name').generate('QualifiedName', function (values) { return MakeQualifiedNameExpression(values[0], values[2].getName()); }),
    get('String', 'Dot', 'Name').generate('QualifiedName', function (values) { return MakeQualifiedNameExpression(values[0], values[2].getName()); }),

    // Expression List
    get('Expression').generate('ExpressionList', function (value) { return [value]; }),
    get('ExpressionList', 'Comma', 'Expression').generate('ExpressionList', function (values) { list = values[0]; list.push(values[2]); return list }),
    
    // Expression Level 3
    get('Expression3').generate('Expression'),
    get('Expression3', 'LogicalAnd', 'Expression2').generate('Expression3', function (values) { return new LogicalAndExpression(values[0], values[2]); }),
    get('Expression3', 'LogicalOr', 'Expression2').generate('Expression3', function (values) { return new LogicalOrExpression(values[0], values[2]); }),
    
    // Comparison, Expression Level 2
    get('Expression2').generate('Expression3'),
    get('BinaryNot', 'Expression2').generate('Expression2', function (values) { return new BinaryNotExpression(values[1]); }),
    get('Expression2', 'Equal', 'Expression1').generate('Expression2', function (values) { return new EqualExpression(values[0], values[2]); }),
    get('Expression2', 'NotEqual', 'Expression1').generate('Expression2', function (values) { return new NotEqualExpression(values[0], values[2]); }),
    get('Expression2', 'LessEqualGreater', 'Expression1').generate('Expression2', function (values) { return new LessEqualGreaterExpression(values[0], values[2]); }),
    get('Expression2', 'LessEqual', 'Expression1').generate('Expression2', function (values) { return new LessEqualExpression(values[0], values[2]); }),
    get('Expression2', 'GreaterEqual', 'Expression1').generate('Expression2', function (values) { return new GreaterEqualExpression(values[0], values[2]); }),
    get('Expression2', 'Less', 'Expression1').generate('Expression2', function (values) { return new LessExpression(values[0], values[2]); }),
    get('Expression2', 'Greater', 'Expression1').generate('Expression2', function (values) { return new GreaterExpression(values[0], values[2]); }),
    get('Expression2', 'BinaryAnd', 'Expression1').generate('Expression2', function (values) { return new BinaryAndExpression(values[0], values[2]); }),
    get('Expression2', 'BinaryOr', 'Expression1').generate('Expression2', function (values) { return new BinaryOrExpression(values[0], values[2]); }),
    get('Expression2', 'BinaryXor', 'Expression1').generate('Expression2', function (values) { return new BinaryXorExpression(values[0], values[2]); }),
    get('Expression2', 'BinaryLeftShift', 'Expression1').generate('Expression2', function (values) { return new BinaryLeftShiftExpression(values[0], values[2]); }),
    get('Expression2', 'BinaryRightShift', 'Expression1').generate('Expression2', function (values) { return new BinaryRightShiftExpression(values[0], values[2]); }),
    
    // Skip initial end of lines in Expression
    //get(get('\n').oneOrMore(), 'Expression').generate('Expression', function (values) { return values[1] }),
    
    // Expression Level 1
    get('Expression1').generate('Expression2'),
    get('Expression1', 'Plus', 'Expression0').generate('Expression1', function (values) { return new AddExpression(values[0], values[2]); }),
    get('Expression1', 'Minus', 'Expression0').generate('Expression1', function (values) { return new SubtractExpression(values[0], values[2]); }),
    
    // Expression Level 0
    get('Expression0').generate('Expression1'),
    get('Expression0', 'Multiply', 'Term').generate('Expression0', function (values) { return new MultiplyExpression(values[0], values[2]); }),
    get('Expression0', 'Divide', 'Term').generate('Expression0', function (values) { return new DivideExpression(values[0], values[2]); }),
    get('Expression0', 'Modulus', 'Term').generate('Expression0', function (values) { return new ModulusExpression(values[0], values[2]); }),
    get('Expression0', 'Power', 'Term').generate('Expression0', function (values) { return new PowerExpression(values[0], values[2]); }),
    
    // Term
    get('Term').generate('Expression0'),
    get('Term', 'LeftBracket', 'ExpressionList', 'RightBracket').generate('Term', function (values) { return new IndexedExpression(values[0], values[2]); }),
    get('Integer').generate('Term'),
    get('@@', 'Name').generate('ClassVariable', function (values) { return new ClassVariableExpression(values[1].getName()); }),
    get('@', 'Name').generate('InstanceVariable', function (values) { return new InstanceVariableExpression(values[1].getName()); }),
    get('Name').generate('Term'),
    get('Keyword').generate('Term'),
    get('InstanceVariable').generate('Term'),
    get('ClassVariable').generate('Term'),
    get('String').generate('Term'),
    get('Array').generate('Term'),
    get('LeftParenthesis', 'Expression', 'RightParenthesis').generate('Expression0', function (values) { return values[1]; }),
    get('LeftBracket', 'RightBracket').generate('Array', function (values) { return new ArrayExpression([]); }),
    get('LeftBracket', 'ExpressionList', 'RightBracket').generate('Array', function (values) { return new ArrayExpression(values[1]); }),
    
    // Statement: Expressiong with end of expression
    get(['\n', ';', '']).generate('EndOfStatement'),
    get('Expression', 'EndOfStatement').generate('Statement', function (values) { return values[0] }),
    get('\n').generate('Statement', function (value) { return null; })
];

function createParser(text) {
    return simplegrammar.createParser(text, rules);
}

module.exports = {
    createParser: createParser
};

