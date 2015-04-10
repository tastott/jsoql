///<reference path="typings/node/node.d.ts"/>

module Jsoql {
    export module Parse {

        var parser = require('./jsoql-parser').parser;

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