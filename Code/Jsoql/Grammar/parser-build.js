var fs = require('fs')
var path = require('path')
var jison = require('jison')
var grammar = require("./jsoql-grammar.json");

var parser = new jison.Parser(grammar);
var parserJs = parser.generateCommonJSModule();

fs.writeFileSync(path.join(__dirname, "../jsoql-parser.js"), parserJs, { encoding: 'utf8' });