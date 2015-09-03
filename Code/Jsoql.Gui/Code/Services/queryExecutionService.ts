import Q = require('q')
import m = require('../Models/models')
import dshs = require('./datasourceHistoryService')
import models = require('jsoql/models')
import engine = require('jsoql/jsoql')

export interface QueryResult extends models.QueryResult {
}

export class QueryExecutionService {

    constructor(private jsoqlEngine: engine.JsoqlEngineBase,
        private datasourceHistoryService: dshs.DatasourceHistoryService) {
    }

    GetQueryHelp(query: string, cursor: models.Position, baseDirectory: string): Q.Promise<models.HelpResult> {
        var context: models.QueryContext = {
            BaseDirectory: baseDirectory
        };

        return this.jsoqlEngine.GetQueryHelp(query, cursor, context);
    }

    ExecuteQuery(query: string, baseDirectory: string): QueryResult {
        var context: models.QueryContext = {
            BaseDirectory: baseDirectory,
            UseCache: false
        };

        return this.jsoqlEngine.ExecuteQuery(query, context);
    }
}