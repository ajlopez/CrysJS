
var parsers = require('../lib/parsers.js');

exports['Get integer'] = function (test) {
    var parser = parsers.createParser("123");
    
    var result = parser.parse("Integer");
    
    test.ok(result);
    test.equal(result.value.evaluate(null), 123);
    test.equal(result.type, "Integer");
    
    test.equal(parser.parse("Integer"), null);
}

exports['Get real'] = function (test) {
    var parser = parsers.createParser("123.45");
    
    var result = parser.parse("Real");
    
    test.ok(result);
    test.equal(result.value.evaluate(null), 123.45);
    test.equal(result.type, "Real");
    
    test.equal(parser.parse("Real"), null);
}

exports['Get integer with spaces'] = function (test) {
    var parser = parsers.createParser("  123   s");
    
    var result = parser.parse("Integer");
    
    test.ok(result);
    test.equal(result.value.evaluate(null), 123);
    test.equal(result.type, "Integer");
    
    test.equal(parser.parse("Integer"), null);
}

exports['Get string'] = function (test) {
    var parser = parsers.createParser('"foo"');
    
    var result = parser.parse("String");
    
    test.ok(result);
    test.equal(result.value.evaluate(null), 'foo');
    test.equal(result.type, "String");
    
    test.equal(parser.parse("String"), null);
}

exports['Get string with escaped characters'] = function (test) {
    var parser = parsers.createParser('"foo\\n\\t\\r\\\\"');
    
    var result = parser.parse("String");
    
    test.ok(result);
    test.equal(result.value.evaluate(null), 'foo\n\t\r\\');
    test.equal(result.type, "String");
    
    test.equal(parser.parse("String"), null);
}

exports['Get array'] = function (test) {
    var parser = parsers.createParser("[1,2,3]");
    
    var result = parser.parse("Array");
    
    test.ok(result);
    test.ok(result.value);
    test.ok(result.value.evaluate);
}

exports['Get empty array'] = function (test) {
    var parser = parsers.createParser("[]");
    
    var result = parser.parse("Array");
    
    test.ok(result);
    test.ok(result.value);
    test.ok(result.value.evaluate);
}

exports['Get dot'] = function (test) {
    var parser = parsers.createParser(".");
    
    var result = parser.parse("Dot");
    
    test.ok(result);
    test.ok(result.value);
}

exports['Get logical or'] = function (test) {
    var parser = parsers.createParser("||");
    
    var result = parser.parse("LogicalOr");
    
    test.ok(result);
    test.ok(result.value);
}

exports['Get logical and'] = function (test) {
    var parser = parsers.createParser("&&");
    
    var result = parser.parse("LogicalAnd");
    
    test.ok(result);
    test.ok(result.value);
}

exports['Get array expression'] = function (test) {
    var parser = parsers.createParser("a[0]");
    
    var result = parser.parse("Term");
    
    test.ok(result);
    test.ok(result.value);
    test.ok(result.value.evaluate);
    test.equal(result.value.getName, null);
    
    test.equal(parser.next(), null);
}

exports['Get name'] = function (test) {
    var parser = parsers.createParser("name");
    
    var result = parser.parse("Name");
    
    test.ok(result);
    test.equal(result.value.getName(), "name");
    test.equal(result.type, "Name");
    
    test.equal(parser.parse("Name"), null);
}

exports['Get keyword'] = function (test) {
    var parser = parsers.createParser(":foo");
    
    var result = parser.parse("Keyword");
    
    test.ok(result);
    test.equal(result.value.getName(), ":foo");
    test.equal(result.type, "Keyword");
    
    test.equal(parser.parse("Keyword"), null);
}

exports['Get keyword as Term'] = function (test) {
    var parser = parsers.createParser(":foo");
    
    var result = parser.parse("Term");
    
    test.ok(result);
    test.equal(result.value.getName(), ":foo");
    test.equal(result.type, "Term");
    
    test.equal(parser.parse("Term"), null);
}

exports['Get name and integer'] = function (test) {
    var parser = parsers.createParser("name 1");
    
    var result = parser.parse("Name");
    
    test.ok(result);
    test.equal(result.value.getName(), "name");
    test.equal(result.type, "Name");
    
    test.ok(parser.parse("Integer"));
    
    test.equal(parser.parse("Name"), null);
}

exports['Get name with underscore'] = function (test) {
    var parser = parsers.createParser("get_name");
    
    var result = parser.parse("Name");
    
    test.ok(result);
    test.equal(result.value.getName(), "get_name");
    test.equal(result.type, "Name");
    
    test.equal(parser.parse("Name"), null);
}

exports['Get name with digits'] = function (test) {
    var parser = parsers.createParser("answer42");
    
    var result = parser.parse("Name");
    
    test.ok(result);
    test.equal(result.value.getName(), "answer42");
    test.equal(result.type, "Name");
    
    test.equal(parser.parse("Name"), null);
}

exports['Get name with spaces'] = function (test) {
    var parser = parsers.createParser("  name   ");
    
    var result = parser.parse("Name");
    
    test.ok(result);
    test.equal(result.value.getName(), "name");
    test.equal(result.type, "Name");
    
    test.equal(parser.parse("Name"), null);
}

exports['Get modulus expression'] = function (test) {
    var parser = parsers.createParser("3%2");
    
    var result = parser.parse("Expression");
    test.ok(result);
    test.equal(parser.next(), null);
}

exports['Get statement with end of line'] = function (test) {
    var parser = parsers.createParser("1+2\n");
    
    var result = parser.parse("Statement");
    test.ok(result);
    test.equal(parser.parse("Statement"), null);
}

exports['Get two statements with end of line'] = function (test) {
    var parser = parsers.createParser("1+2\n3+2\n");
    
    var result = parser.parse("Statement");
    test.ok(result);
    
    result = parser.parse("Statement");
    test.ok(result);
    
    test.equal(parser.parse("Statement"), null);
}

exports['Get two statements with semicolon'] = function (test) {
    var parser = parsers.createParser("1+2;3+2;");
    
    var result = parser.parse("Statement");
    test.ok(result);
    
    result = parser.parse("Statement");
    test.ok(result);
    
    test.equal(parser.parse("Statement"), null);
}

exports['Get while expression'] = function (test) {
    var parser = parsers.createParser("while 1\na=1\nend");
    
    var result = parser.parse("Expression");
    test.ok(result);
    
    test.equal(parser.parse("Expression"), null);
}

exports['Get while expression with do'] = function (test) {
    var parser = parsers.createParser("while 1 do\na=1\nend");
    
    var result = parser.parse("Expression");
    test.ok(result);
    
    test.equal(parser.parse("Expression"), null);
}

exports['Get until expression'] = function (test) {
    var parser = parsers.createParser("until 1\na=1\nend");
    
    var result = parser.parse("Expression");
    test.ok(result);
    
    test.equal(parser.parse("Expression"), null);
}

exports['Get until expression with do'] = function (test) {
    var parser = parsers.createParser("until 1 do\na=1\nend");
    
    var result = parser.parse("Expression");
    test.ok(result);
    
    test.equal(parser.parse("Expression"), null);
}

exports['Get class expression'] = function (test) {
    var parser = parsers.createParser("class Dog\nend");
    
    var result = parser.parse("Expression");
    test.ok(result);
    test.ok(result.value);
    test.equal(result.value.getName(), "Dog");
    test.equal(result.value.getSuperName(), null);
    
    test.equal(parser.parse("Expression"), null);
}

exports['Get class expression with super class'] = function (test) {
    var parser = parsers.createParser("class Dog < Animal\nend");
    
    var result = parser.parse("Expression");
    test.ok(result);
    test.ok(result.value);
    test.equal(result.value.getName(), "Dog");
    test.equal(result.value.getSuperName(), 'Animal');
    
    test.equal(parser.parse("Expression"), null);
}

exports['Get class expression with empty def'] = function (test) {
    var parser = parsers.createParser("class Dog\ndef foo\nend\nend");
    
    var result = parser.parse("Expression");
    test.ok(result);
    test.ok(result.value);
    test.equal(result.value.getName(), "Dog");
    
    test.equal(parser.parse("Expression"), null);
}

exports['Get module expression'] = function (test) {
    var parser = parsers.createParser("module Dog\nend");
    
    var result = parser.parse("Expression");
    test.ok(result);
    test.ok(result.value);
    test.equal(result.value.getName(), "Dog");
    
    test.equal(parser.parse("Expression"), null);
}

exports['Get module expression with empty def'] = function (test) {
    var parser = parsers.createParser("module Dog\ndef foo\nend\nend");
    
    var result = parser.parse("Expression");
    test.ok(result);
    test.ok(result.value);
    test.equal(result.value.getName(), "Dog");
    
    test.equal(parser.parse("Expression"), null);
}

exports['Get expression enclosed in parenthesis'] = function (test) {
    var parser = parsers.createParser("(2+3)");
    
    var result = parser.parse("Expression");
    test.ok(result);
    
    test.equal(parser.parse("Expression"), null);
}

exports['Get expression enclosed in parenthesis and multiply'] = function (test) {
    var parser = parsers.createParser("(2+3)*3");
    
    var result = parser.parse("Expression");
    test.ok(result);
    
    test.equal(parser.parse("Expression"), null);
}

exports['Skip line comment'] = function (test) {
    var parser = parsers.createParser("# this is a comment\r\n42");
    var result = parser.parse('Statement');
    test.ok(result);
    test.equal(result.value.evaluate(), 42);
    test.equal(parser.next(), null);
}

exports['Get qualified name'] = function (test) {
    var parser = parsers.createParser("a.b");
    var result = parser.parse('QualifiedName');
    test.ok(result);
    test.equal(result.value.getName(), "b");
    test.equal(result.value.getTarget().getName(), "a");
}

exports['Get qualified call'] = function (test) {
    var parser = parsers.createParser("a.b");
    var result = parser.parse('QualifiedCall');
    test.ok(result);
}

exports['Get empty def'] = function (test) {
    var parser = parsers.createParser("def foo\nend");
    var result = parser.parse('Statement');
    test.ok(result);
    test.equal(parser.next(), null);
}

exports['Get empty def using self'] = function (test) {
    var parser = parsers.createParser("def self.foo\nend");
    var result = parser.parse('Statement');
    test.ok(result);
    test.equal(parser.next(), null);
}

exports['Get empty def with parenthesis'] = function (test) {
    var parser = parsers.createParser("def foo()\nend");
    var result = parser.parse('Statement');
    test.ok(result);
    test.equal(parser.next(), null);
}

exports['Get empty def with argument'] = function (test) {
    var parser = parsers.createParser("def foo(a)\nend");
    var result = parser.parse('Statement');
    test.ok(result);
    test.equal(parser.next(), null);
}

exports['Get empty def with arguments'] = function (test) {
    var parser = parsers.createParser("def foo(a,b)\nend");
    var result = parser.parse('Statement');
    test.ok(result);
    test.equal(parser.next(), null);
}

exports['Get begin end'] = function (test) {
    var parser = parsers.createParser("begin\na=1\nb=2\end");
    var result = parser.parse('Expression');
    test.ok(result);
    test.equal(parser.next(), null);
}

exports['Get instance variable'] = function (test) {
    var parser = parsers.createParser("@foo");
    var result = parser.parse('Expression');
    test.ok(result);
    test.equal(parser.next(), null);
}

exports['Get class variable'] = function (test) {
    var parser = parsers.createParser("@@foo");
    var result = parser.parse('Expression');
    test.ok(result);
    test.equal(parser.next(), null);
}

exports['Get expression with unless'] = function (test) {
    var parser = parsers.createParser("a unless b");
    
    var result = parser.parse("Expression");
    
    test.ok(result);
    test.equal(result.type, "Expression");
    
    test.equal(parser.parse("Expression"), null);
}

