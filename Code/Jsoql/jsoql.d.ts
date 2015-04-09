/// <reference path="Scripts/typings/node/node.d.ts" />
/// <reference path="Scripts/typings/lazyjs/lazyjs.d.ts" />
/// <reference path="Scripts/typings/q/Q.d.ts" />
declare module Jsoql {
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
}
declare module Jsoql {
    module Utilities {
        function IsArray(value: any): boolean;
    }
}
declare module Jsoql {
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
}
