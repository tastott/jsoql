
import fs  = require('fs')
var jison = require('jison')


var bnf = fs.readFileSync("jql.jison", "utf8");
var parser = new jison.Parser(bnf);

export function Parse(source: string) : Statement{
    return parser.parse(source);
}

export interface WhereClause {
    Operator: string;
    Args: any[]
};


export interface Statement {
    Select: any[];
    From: any;
    Where: WhereClause;
    GroupBy: any;
}

