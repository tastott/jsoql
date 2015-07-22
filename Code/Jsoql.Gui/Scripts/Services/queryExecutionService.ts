import Q = require('q')
import m = require('../Models/models')
import dshs = require('./datasourceHistoryService')
import jsoql = require('jsoql')

export interface QueryResult extends jsoql.JsoqlQueryResult {
}

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

    ExecuteQuery(query: string, baseDirectory: string): QueryResult {
        var context: jsoql.JsoqlQueryContext = {
            BaseDirectory: baseDirectory,
            UseCache: false
        };

        return this.jsoqlEngine.ExecuteQuery(query, context);
    }
}