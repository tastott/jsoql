///<reference path="Scripts/typings/q/Q.d.ts"/>
import Q = require('q')
import p = require('./Scripts/parse')
import q = require('./Scripts/query')
import m = require('./Scripts/models')

export interface QueryResult {
    Results?: any[];
    Errors?: string[]
}

export function ExecuteQuery(jsoql: string, context?: m.QueryContext): Q.Promise<QueryResult>  {

    try {
        var statement: p.Statement;
        statement = p.Parse(jsoql);

        var query = new q.JsoqlQuery(statement, context);

        return query.Execute()
            .then(results => {
                return { Results: results }
            });
    }
    catch (ex) {
        var result: QueryResult = {
            Errors: [ex]
        };

        return Q(result);
    }
       
}