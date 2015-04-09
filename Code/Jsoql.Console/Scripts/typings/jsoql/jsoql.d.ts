///<reference path="../q/Q.d.ts"/>

declare module 'jsoql' {
    module Parse {
        function Parse(source: string): Statement;
        interface WhereClause {
            Operator: string;
            Args: any[];
        }
        interface Selectable {
            Expression: any;
            Alias: string;
        }
        interface Statement {
            Select: Selectable[];
            From: any;
            Where: WhereClause;
            GroupBy: any;
        }
    }

    module Query {
        interface Group {
            Key: any;
            Items: any[];
        }
        interface NamedArrays {
            [name: string]: any[];
        }
        class JsoqlQuery {
            private stmt;
            private static SingleTableAlias;
            private dataSource;
            constructor(stmt: Parse.Statement, namedArrays?: NamedArrays);
            private DoOperation(operator, args);
            private DoAggregateFunction(name, items);
            private Evaluate(expression, target);
            private Key(expression);
            private EvaluateGroup(expression, group);
            private From(fromClause);
            private CollectFromTargets(fromClauseNode);
            Execute(): Q.Promise<any[]>;
            private GroupBy(seq, expressions);
            private static IsAggregate(expression);
            private static SequenceToArray<T>(seq);
        }
    }


    module Utilities {
        function IsArray(value: any): boolean;
    }
}
//declare var jsoql: string;
//declare var stmt: Jsoql.Parse.Statement;
//declare var query: Jsoql.Query.JsoqlQuery;
