import fs = require('fs')
import path = require('path')
var jison = require('jison')
var grammar = require("./jsoql-grammar.json");
import tokens = require('./tokens')
import exp = require('./expressions')

grammar.lex.rules = tokens.GetJisonTokens();

var expressions = exp.GetJisonExpressions();

Object.keys(expressions)
    //.filter((exp, i) => i < 8)
    .forEach(exp => {
        grammar.bnf[exp] = expressions[exp];
    });

console.log(grammar.bnf);

var parser = new jison.Parser(grammar);
var parserJs = parser.generateCommonJSModule();

fs.writeFileSync(path.join(__dirname, "../jsoql-parser.js"), parserJs, { encoding: 'utf8' });