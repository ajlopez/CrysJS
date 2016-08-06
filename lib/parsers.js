
var simplegrammar = require('simplegrammar');
var x = require('./expressions');

var get = simplegrammar.get;
var peek = simplegrammar.peek;

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
    get('"').upTo('"', '\\', escape).generate('String', function (value) { return x.constant(value.substring(1, value.length - 1)); }),
    get(get('0-9').oneOrMore(), '.', get('0-9').oneOrMore()).generate('Real', function (value) { return x.constant(parseFloat(value)) }),
    get('-', get('0-9').oneOrMore(), '.', get('0-9').oneOrMore()).generate('Real', function (value) { return x.constant(parseFloat(value)) }),
    get('0-9').oneOrMore().generate('Integer', function (value) { return x.constant(parseInt(value)) }),
    get('-', get('0-9').oneOrMore()).generate('Integer', function (value) { return x.constant(parseInt(value)) }),
    get(['a-z', 'A-Z', '_'], get(['a-z', 'A-Z', '0-9', '_']).zeroOrMore()).generate('Name', function (value) { return x.name(value) }),
    get(':', ['a-z', 'A-Z', '_'], get(['a-z', 'A-Z', '0-9', '_']).zeroOrMore()).generate('Keyword', function (value) { return x.keyword(value) }),
    
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
    
    get('StatementList').generate('Program', function (value) { return x.composite(value); }),
    get('StatementList', 'Statement').generate('StatementList', function (values) { if (values[1] == null) return values[0]; var list = values[0]; list.push(values[1]); return list; }),
    get('Statement').generate('StatementList', function (value) { if (value == null) return []; return [value]; }),
    
    // Class
    
    get('class', 'Name', 'Less', 'Name', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.klass(values[1].getName(), values[3].getName(), x.composite(values[5])); }),
    get('class', 'Name', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.klass(values[1].getName(), x.composite(values[3])); }),

    // Module
    
    get('module', 'Name', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.module(values[1].getName(), x.composite(values[3])); }),
    
    // Def
    get('def', 'Name', 'Dot', 'Name', 'LeftParenthesis', 'RightParenthesis', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.defnamed(values[1].getName(), values[3].getName(), [], x.composite(values[7])); }),
    get('def', 'Name', 'Dot', 'Name', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.defnamed(values[1].getName(), values[3].getName(), [], x.composite(values[5])); }),
    get('def', 'Name', 'LeftParenthesis', 'RightParenthesis', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.def(values[1].getName(), [], x.composite(values[5])); }),
    get('def', 'Name', 'LeftParenthesis', 'NameList', 'RightParenthesis', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.def(values[1].getName(), values[3], x.composite(values[6])); }),
    get('def', 'Name', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.def(values[1].getName(), [], x.composite(values[3])); }),

    get('Name', 'Comma', 'NameList').generate('NameList', function (values) { var list = values[2]; list.unshift(values[0].getName()); return list; }),
    get('Name', peek('RightParenthesis')).generate('NameList', function (values) { return [values[0].getName()]; }),
    
    // If, Unless and Suite
    get('if', 'Expression', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.if(values[1], x.composite(values[3])); }),
    get('if', 'Expression', 'EndOfStatement', 'Suite', 'else', 'Suite', 'end').generate('Expression', function (values) { return x.if(values[1], x.composite(values[3]), new CompositeExpression(values[5])); }),
    get('unless', 'Expression', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.unless(values[1], x.composite(values[3])); }),
    get('unless', 'Expression', 'EndOfStatement', 'Suite', 'else', 'Suite', 'end').generate('Expression', function (values) { return x.unless(values[1], x.composite(values[3]), new CompositeExpression(values[5])); }),
    peek('end').generate('Suite', function (values) { return []; }),
    peek('else').generate('Suite', function (values) { return []; }),
    get('Statement', 'Suite').generate('Suite', function (values) { if (values[0] == null) return values[1]; var vals = values[1]; vals.unshift(values[0]); return vals; }),
    get('Expression', 'unless', 'Expression').generate('Expression', function (values) { return x.unless(values[2], values[0]); }),
    //get('Expression', 'Suite').generate('Suite', function (values) { var vals = values[1]; vals.unshift(values[0]); return vals; }),
    
    // While and Suite
    get('while', 'Expression', 'do', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.while(values[1], x.composite(values[4])); }),
    get('while', 'Expression', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.while(values[1], x.composite(values[3])); }),
    
    // Until and Suite
    get('until', 'Expression', 'do', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.until(values[1], x.composite(values[4])); }),
    get('until', 'Expression', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.until(values[1], x.composite(values[3])); }),

    // Begin to End
    get('begin', 'EndOfStatement', 'Suite', 'end').generate('Expression', function (values) { return x.composite(values[2]); }),

    // Call
//    get('Call').generate('Term'),
    get('Name', 'LeftBracket', 'ExpressionList', 'RightBracket').generate('Term', function (values) { return x.indexed(values[0], values[2]); }),
    get('Name', 'ExpressionList').generate('Term', function (values) { return x.call(values[0].getName(), values[1]); }),
    get('Name', 'LeftParenthesis', 'ExpressionList', 'RightParenthesis').generate('Term', function (values) { return x.call(values[0].getName(), values[2]); }),
    get('Name', 'LeftParenthesis', 'RightParenthesis').generate('Term', function (values) { return x.call(values[0].getName(), []); }),
        
    // Assignment
    get('Name', 'Assign', 'Expression').generate('Expression', function (values) { return x.assign(values[0], values[2]); }),
    get('InstanceVariable', 'Assign', 'Expression').generate('Expression', function (values) { return x.assign(values[0], values[2]); }),
    get('ClassVariable', 'Assign', 'Expression').generate('Expression', function (values) { return x.assign(values[0], values[2]); }),
    
    // Qualified Call
    get('QualifiedCall').generate('Term'),
    get('QualifiedName', 'ExpressionList').generate('QualifiedCall', function (values) { return x.qualifiedcall(values[0], values[1]); }),
    get('QualifiedName', 'LeftParenthesis', 'ExpressionList', 'RightParenthesis').generate('QualifiedCall', function (values) { return x.qualifiedcall(values[0], values[2]); }),
    get('QualifiedName', 'LeftParenthesis', 'RightParenthesis').generate('QualifiedCall', function (values) { return x.qualifiedcall(values[0], []); }),
    get('QualifiedName').generate('QualifiedCall', function (value) { return x.qualifiedcall(value, null); }),
    
    // Qualified Name
    get('QualifiedName', 'Dot', 'Name').generate('QualifiedName', function (values) { return x.qualifiedname(values[0], values[2].getName()); }),
    get('Name', 'Dot', 'Name').generate('QualifiedName', function (values) { return x.qualifiedname(values[0], values[2].getName()); }),
    get('Integer', 'Dot', 'Name').generate('QualifiedName', function (values) { return x.qualifiedname(values[0], values[2].getName()); }),
    get('String', 'Dot', 'Name').generate('QualifiedName', function (values) { return x.qualifiedname(values[0], values[2].getName()); }),

    // Expression List
    get('Expression').generate('ExpressionList', function (value) { return [value]; }),
    get('ExpressionList', 'Comma', 'Expression').generate('ExpressionList', function (values) { list = values[0]; list.push(values[2]); return list }),
    
    // Expression Level 3
    get('Expression3').generate('Expression'),
    get('Expression3', 'LogicalAnd', 'Expression2').generate('Expression3', function (values) { return x.and(values[0], values[2]); }),
    get('Expression3', 'LogicalOr', 'Expression2').generate('Expression3', function (values) { return x.or(values[0], values[2]); }),
    
    // Comparison, Expression Level 2
    get('Expression2').generate('Expression3'),
    get('BinaryNot', 'Expression2').generate('Expression2', function (values) { return x.bnot(values[1]); }),
    get('Expression2', 'Equal', 'Expression1').generate('Expression2', function (values) { return x.eq(values[0], values[2]); }),
    get('Expression2', 'NotEqual', 'Expression1').generate('Expression2', function (values) { return x.noteq(values[0], values[2]); }),
    get('Expression2', 'LessEqualGreater', 'Expression1').generate('Expression2', function (values) { return x.lteqgt(values[0], values[2]); }),
    get('Expression2', 'LessEqual', 'Expression1').generate('Expression2', function (values) { return x.lesseq(values[0], values[2]); }),
    get('Expression2', 'GreaterEqual', 'Expression1').generate('Expression2', function (values) { return x.greatereq(values[0], values[2]); }),
    get('Expression2', 'Less', 'Expression1').generate('Expression2', function (values) { return x.less(values[0], values[2]); }),
    get('Expression2', 'Greater', 'Expression1').generate('Expression2', function (values) { return x.greater(values[0], values[2]); }),
    get('Expression2', 'BinaryAnd', 'Expression1').generate('Expression2', function (values) { return new x.band(values[0], values[2]); }),
    get('Expression2', 'BinaryOr', 'Expression1').generate('Expression2', function (values) { return x.bor(values[0], values[2]); }),
    get('Expression2', 'BinaryXor', 'Expression1').generate('Expression2', function (values) { return x.bxor(values[0], values[2]); }),
    get('Expression2', 'BinaryLeftShift', 'Expression1').generate('Expression2', function (values) { return x.lshift(values[0], values[2]); }),
    get('Expression2', 'BinaryRightShift', 'Expression1').generate('Expression2', function (values) { return x.rshift(values[0], values[2]); }),
    
    // Skip initial end of lines in Expression
    //get(get('\n').oneOrMore(), 'Expression').generate('Expression', function (values) { return values[1] }),
    
    // Expression Level 1
    get('Expression1').generate('Expression2'),
    get('Expression1', 'Plus', 'Expression0').generate('Expression1', function (values) { return x.add(values[0], values[2]); }),
    get('Expression1', 'Minus', 'Expression0').generate('Expression1', function (values) { return x.subtract(values[0], values[2]); }),
    
    // Expression Level 0
    get('Expression0').generate('Expression1'),
    get('Expression0', 'Multiply', 'Term').generate('Expression0', function (values) { return x.multiply(values[0], values[2]); }),
    get('Expression0', 'Divide', 'Term').generate('Expression0', function (values) { return new x.divide(values[0], values[2]); }),
    get('Expression0', 'Modulus', 'Term').generate('Expression0', function (values) { return x.mod(values[0], values[2]); }),
    get('Expression0', 'Power', 'Term').generate('Expression0', function (values) { return x.power(values[0], values[2]); }),
    
    // Term
    get('Term').generate('Expression0'),
    get('Term', 'LeftBracket', 'ExpressionList', 'RightBracket').generate('Term', function (values) { return x.indexed(values[0], values[2]); }),
    get('Integer').generate('Term'),
    get('$', 'Name').generate('GlobalVariable', function (values) { return x.globalvar(values[1].getName()); }),
    get('@@', 'Name').generate('ClassVariable', function (values) { return x.classvar(values[1].getName()); }),
    get('@', 'Name').generate('InstanceVariable', function (values) { return x.instancevar(values[1].getName()); }),
    get('LeftParenthesis', 'Expression', 'RightParenthesis').generate('Term', function (values) { return values[1]; }),
    get('Name').generate('Term'),
    get('Keyword').generate('Term'),
    get('InstanceVariable').generate('Term'),
    get('ClassVariable').generate('Term'),
    get('GlobalVariable').generate('Term'),
    get('String').generate('Term'),
    get('Array').generate('Term'),
    get('LeftParenthesis', 'Expression', 'RightParenthesis').generate('Expression0', function (values) { return values[1]; }),
    get('LeftBracket', 'RightBracket').generate('Array', function (values) { return x.array([]); }),
    get('LeftBracket', 'ExpressionList', 'RightBracket').generate('Array', function (values) { return x.array(values[1]); }),
    
    // Statement: Expressiong with end of expression
    get('\r', '\n').generate('EndOfStatement'),
    get('\r').generate('EndOfStatement'),
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

