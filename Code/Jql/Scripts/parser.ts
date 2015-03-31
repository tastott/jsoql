import fs = require('fs')
import lazy = require('lazy.js')
var jison = require('jison')

var bnf = fs.readFileSync("jql.jison", "utf8");
var parser = new jison.Parser(bnf);

export function Parse(source: string) {
    return parser.parse(source);
}