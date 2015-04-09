///<reference path="typings/node/node.d.ts"/>

module Jsoql {
    export module Parse {

        var fs = require('fs')
        var path = require('path')
        var jison = require('jison')

        var bnf = fs.readFileSync(path.join(__dirname, "jsoql.jison"), "utf8");
        var parser = new jison.Parser(bnf);

        export function Parse(source: string): Statement {
            return parser.parse(source);
        }

        export interface WhereClause {
            Operator: string;
            Args: any[]
        };

        export interface Selectable {
            Expression: any;
            Alias: string;
        }

        export interface Statement {
            Select: Selectable[];
            From: any;
            Where: WhereClause;
            GroupBy: any;
        }

    }
}