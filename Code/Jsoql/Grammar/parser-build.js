var fs = require('fs');
var path = require('path');
var jison = require('jison');
var grammar = require("./jsoql-grammar.json");
var tokens = require('./tokens');
var exp = require('./expressions');
grammar.lex.rules = tokens.GetJisonTokens();
var expressions = exp.GetJisonExpressions();
Object.keys(expressions).forEach(function (exp) {
    grammar.bnf[exp] = expressions[exp];
});
console.log(grammar.bnf);
var parser = new jison.Parser(grammar);
var parserJs = parser.generateCommonJSModule();
fs.writeFileSync(path.join(__dirname, "../jsoql-parser.js"), parserJs, { encoding: 'utf8' });
//# sourceMappingURL=parser-build.js.map