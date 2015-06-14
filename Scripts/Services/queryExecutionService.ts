import Q = require('q')
import m = require('../Models/models')
import dshs = require('./datasourceHistoryService')
import jsoql = require('jsoql')

export class QueryExecutionService {

    constructor(private jsoqlEngine: jsoql.JsoqlEngine,
        private datasourceHistoryService: dshs.DatasourceHistoryService) {
    }

    GetQueryHelp(query: string, cursor: jsoql.JsoqlPosition, baseDirectory: string): Q.Promise<jsoql.JsoqlQueryHelpResult> {
        var context: jsoql.JsoqlQueryContext = {
            BaseDirectory: baseDirectory
        };

        return this.jsoqlEngine.GetQueryHelp(query, cursor, context);
    }

    ExecuteQueryPaged(query: string, baseDirectory: string): jsoql.JsoqlQueryExecution {
        var context: jsoql.JsoqlQueryContext = {
            BaseDirectory: baseDirectory
        };

        return this.jsoqlEngine.ExecuteQueryLazy(query, context);
    }

    ExecuteQuery(query: string, baseDirectory: string): Q.Promise<m.QueryResult> {
        var context: jsoql.JsoqlQueryContext = {
            BaseDirectory: baseDirectory
        };

        return this.jsoqlEngine.ExecuteQuery(query, context)
            .then(jsoqlResult => {

                //Remember datasources
                if (jsoqlResult.Datasources) {
                    jsoqlResult.Datasources.forEach(ds => this.datasourceHistoryService.Add(ds));
                }

                return {
                    Results: jsoqlResult.Results,
                    Errors: jsoqlResult.Errors
                };
            });
    }
}