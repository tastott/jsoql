///<reference path="typings/q/Q.d.ts"/>
import Q = require('q')
import p = require('./parse')
import q = require('./query')
import m = require('./models')
import ds = require('./datasource')

export class JsoqlEngine {
    constructor(private datasources: ds.DataSources) {
    }

    public ExecuteQuery(jsoql: string, context?: m.QueryContext): Q.Promise<m.QueryResult> {

        try {
            var statement: p.Statement;
            statement = p.Parse(jsoql);

            var query = new q.JsoqlQuery(statement, this.datasources, context);

            return query.Execute()
                .then(results => {
                return { Results: results }
            });
        }
        catch (ex) {
            var result: m.QueryResult = {
                Errors: [ex]
            };

            return Q(result);
        }
    }
}

export class DesktopJsoqlEngine extends JsoqlEngine {
    constructor() {
        super({
            "var": new ds.VariableDataSource(),
            "file": new ds.SmartFileDataSource(),
            "http": new ds.HttpDataSource()
        });
    }
}

export class OnlineJsoqlEngine extends JsoqlEngine {
    constructor(urlTransform: (url: string) => string,
        responseParser: (response: string) => any) {
        super({
            "var": new ds.VariableDataSource(),
            "file": new ds.SmartFileDataSource(),
            "http": new ds.HttpDataSource(urlTransform, responseParser)
        });
    }
}