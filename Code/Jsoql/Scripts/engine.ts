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
            statement = p.FullParse(jsoql);

            var query = new q.JsoqlQuery(statement, this.datasources, context);
            var datasources = query.GetDatasources();

            return query.Execute()
                .then(results => {
                    return {
                        Results: results,
                        Datasources: datasources
                    }
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
            "file": new ds.DesktopSmartFileDataSource(),
            "http": new ds.StreamingHttpDataSource()
        });
    }
}

export class OnlineJsoqlEngine extends JsoqlEngine {
    constructor(appBaseUrl : string, getFileStorageKey : (id : string) => string) {
        super({
            "var": new ds.VariableDataSource(),
            "file": new ds.OnlineSmartFileDataSource(getFileStorageKey),
            "http": new ds.OnlineStreamingHttpDataSource('http://query.yahooapis.com/v1/public/yql', appBaseUrl)
        });
    }
}