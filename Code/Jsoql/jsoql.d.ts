/// <reference path="Scripts/typings/node/node.d.ts" />
/// <reference path="Scripts/typings/lazyjs/lazyjs.d.ts" />
/// <reference path="Scripts/typings/q/Q.d.ts" />
declare module Jsoql {
    module DataSources {
        interface DataSourceParameters {
            format?: string;
            headers?: string;
            skip?: string;
        }
        interface DataSource {
            Get(value: string, parameters: any, context: QueryContext): LazyJS.Sequence<any>;
        }
        class FileDataSource implements DataSource {
            private GetLineMapper(filePath, parameters);
            Get(value: string, parameters: DataSourceParameters, context: QueryContext): LazyJS.Sequence<any>;
        }
        class VariableDataSource implements DataSource {
            Get(value: string, parameters: any, context: QueryContext): LazyJS.Sequence<any>;
        }
    }
}
declare var lazy: LazyJS.LazyStatic;
declare var factory: () => LazyJS.Sequence<any>;
declare module Jsoql {
    module Lazy {
        var lazyJsonFile: (file: string) => LazyJS.Sequence<any>;
    }
}
declare module Jsoql {
    module Parse {
        function Parse(source: string): Statement;
        interface Selectable {
            Expression: any;
            Alias: string;
        }
        interface Statement {
            Select: Selectable[];
            FromWhere: {
                From: any;
                Where: any;
            };
            GroupBy: any;
            OrderBy: {
                Expression: any;
                Asc: boolean;
            }[];
        }
    }
}
declare module Jsoql {
    module Utilities {
        function IsArray(value: any): boolean;
        function ReadFirstLineSync(filepath: string, maxChars?: number): string;
    }
}
declare module Jsoql {
    module Query {
        interface Group {
            Key: any;
            Items: any[];
        }
        interface QueryContext {
            BaseDirectory?: string;
            Data?: {
                [key: string]: any[];
            };
        }
        class JsoqlQuery {
            private stmt;
            private queryContext;
            private static dataSources;
            constructor(stmt: Parse.Statement, queryContext?: QueryContext);
            private DoOperation(operator, args);
            private DoAggregateFunction(name, items);
            private EvaluateAliased(expression, target, alias?);
            private Evaluate(expression, target);
            private Key(expression);
            private EvaluateGroup(expression, group);
            private GetSequence(target);
            private From(fromClause);
            private CollectFromTargets(fromClauseNode);
            Execute(): Q.Promise<any[]>;
            private GroupBy(seq, expressions);
            private static IsAggregate(expression);
            private static SequenceToArray<T>(seq);
        }
    }
}
declare module Jsoql {
    module QueryString {
        function Parse(value: string): any;
    }
}
declare module Jsoql {
    interface QueryResult {
        Results?: any[];
        Errors?: string[];
    }
    interface QueryContext {
        BaseDirectory?: string;
        Data?: {
            [key: string]: any[];
        };
    }
    function ExecuteQuery(jsoql: string, context?: QueryContext): Q.Promise<QueryResult>;
}
