///<reference path="Scripts/parse.ts" />
///<reference path="Scripts/query.ts" />

module Jsoql {
    var Q = require('Q');

    export interface QueryResult {
        Results?: any[];
        Errors?: string[]
    }

    export function ExecuteQuery(jsoql: string): Q.Promise<QueryResult>  {
        var statement: Parse.Statement;
        try {
            statement = Parse.Parse(jsoql);
        }
        catch (err) {
            return Q({ Errors: [err] });
        }

        var query = new Query.JsoqlQuery(statement);

        return query.Execute()
            .then(results => {
                return { Results: results }
            });
    }
}

module.exports = Jsoql;