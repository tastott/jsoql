var fs = require('fs');
var path = require('path');
var clone = require('clone');
var jison = require('jison');
var grammarTemplate = require("./jsoql-grammar-template.json");
var tokens = require('./tokens');
var exp = require('./expressions');
function MakeParser(tokens, expressions, parserPath) {
    var grammar = clone(grammarTemplate);
    grammar.lex.rules = tokens;
    Object.keys(expressions).forEach(function (exp) {
        grammar.bnf[exp] = expressions[exp];
    });
    var parser = new jison.Parser(grammar);
    var parserJs = parser.generateCommonJSModule();
    fs.writeFileSync(parserPath, parserJs, { encoding: 'utf8' });
}
var jisonTokens = tokens.GetJisonTokens();
var jisonExpressions = exp.GetJisonExpressions();
var parserPath = path.join(__dirname, "../jsoql-full-parser.js");
MakeParser(jisonTokens, jisonExpressions, parserPath);
//# sourceMappingURL=parser-build.js.map