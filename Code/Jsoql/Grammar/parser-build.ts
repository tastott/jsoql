import fs = require('fs')
import path = require('path')
var clone = require('clone')
var jison = require('jison')
var grammarTemplate = require("./jsoql-grammar-template.json");
import tokens = require('./tokens')
import exp = require('./expressions')

function MakeParser(tokens: string[][], expressions: any, parserPath : string, log : boolean = false) {
    var grammar = clone(grammarTemplate);
    grammar.lex.rules = tokens;

    Object.keys(expressions).forEach(exp => {
        grammar.bnf[exp] = expressions[exp];
    });

    if (log) console.log(grammar.bnf);

    var parser = new jison.Parser(grammar);
    var parserJs = parser.generateCommonJSModule();

    fs.writeFileSync(parserPath, parserJs, { encoding: 'utf8' });
}

var jisonTokens = tokens.GetJisonTokens();


//Full parser
MakeParser(jisonTokens, exp.GetJisonExpressionsFull(), path.join(__dirname, "./jsoql-full-parser.js"));

//Helpful parser
MakeParser(jisonTokens, exp.GetJisonExpressionsHelpful(), path.join(__dirname, "./jsoql-helpful-parser.js"));

