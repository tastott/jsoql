var fs = require('fs');
var path = require('path');
var clone = require('clone');
var jison = require('jison');
var grammarTemplate = require("./jsoql-grammar-template.json");
var tokens = require('./tokens');
var exp = require('./expressions');
function MakeParser(tokens, expressions, parserPath, log) {
    if (log === void 0) { log = false; }
    var grammar = clone(grammarTemplate);
    grammar.lex.rules = tokens;
    Object.keys(expressions).forEach(function (exp) {
        grammar.bnf[exp] = expressions[exp];
    });
    if (log)
        console.log(grammar.bnf);
    var parser = new jison.Parser(grammar);
    var parserJs = parser.generateCommonJSModule();
    fs.writeFileSync(parserPath, parserJs, { encoding: 'utf8' });
}
var jisonTokens = tokens.GetJisonTokens();
//Full parser
MakeParser(jisonTokens, exp.GetJisonExpressionsFull(), path.join(__dirname, "./jsoql-full-parser.js"));
//Helpful parser
MakeParser(jisonTokens, exp.GetJisonExpressionsHelpful(), path.join(__dirname, "./jsoql-helpful-parser.js"), true);
