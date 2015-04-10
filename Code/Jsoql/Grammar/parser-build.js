var fs = require('fs')
var path = require('path')
var jison = require('jison')

var bnf = fs.readFileSync(path.join(__dirname, "jsoql.jison"), "utf8");
var parser = new jison.Parser(bnf);
var parserJs = parser.generateCommonJSModule();

fs.writeFileSync(path.join(__dirname, "../jsoql-parser.js"), parserJs, { encoding: 'utf8' });