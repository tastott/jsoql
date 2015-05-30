///<reference path="../typings/jsoql/jsoql.d.ts" />
import Q = require('q')
import m = require('../Models/models')
import dshs = require('./datasourceHistoryService')


export class QueryExecutionService {

    constructor(private jsoqlEngine: JsoqlEngine,
        private datasourceHistoryService: dshs.DatasourceHistoryService) {
    }

    GetQueryHelp(query: string, cursor: JsoqlPosition, baseDirectory: string): Q.Promise<JsoqlQueryHelpResult> {
        var context: JsoqlQueryContext = {
            BaseDirectory: baseDirectory
        };

        return this.jsoqlEngine.GetQueryHelp(query, cursor, context);
    }

    ExecuteQuery(query: string, baseDirectory: string): Q.Promise<m.QueryResult> {
        var context: JsoqlQueryContext = {
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