///<reference path="typings/q/Q.d.ts"/>
import Q = require('q')
import p = require('./parse')
import q = require('./query')
import m = require('./models')
import ds = require('./datasource')
import qh = require('./query-help')

export class JsoqlEngine {
    private queryHelper: qh.QueryHelper;

    constructor(private datasources: ds.DataSourceSequencers) {
        this.queryHelper = new qh.QueryHelper(this);
    }

    public ExecuteQuery(statement: p.Statement|string, context?: m.QueryContext): Q.Promise<m.QueryResult> {

        var parsedStatement: p.Statement;

        try {
            if (typeof statement === 'string') parsedStatement = p.ParseFull(statement);
            else parsedStatement = statement;

            var query = new q.JsoqlQuery(parsedStatement, this.datasources, context);
            var validationErrors = query.Validate();

            if (validationErrors.length) return Q({ Errors: validationErrors });

            //Get datasources used in query excluding any scope-specific stuff (i.e. variables)

            var datasources = query.GetDatasources()
                .filter(ds => ds.Type !== 'var');

            return query.Execute()
                .then(results => {
                    return {
                        Results: results,
                        Datasources: datasources
                    }
                })
                .fail(error => {
                    return {
                        Results: null,
                        Datasources: datasources,
                        Errors: [error]
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

    public GetQueryHelp(jsoql: string, cursorPositionOrIndex: m.Position|number, context?: m.QueryContext): Q.Promise<m.HelpResult> {
        try {
            return this.queryHelper.GetQueryHelp(jsoql, cursorPositionOrIndex, context);
        }
        catch (ex) {
            return Q.reject<any>(ex);
        }
        
    }
}

export class DesktopJsoqlEngine extends JsoqlEngine {
    constructor() {
        super({
            "var": new ds.VariableDataSourceSequencer(),
            "file": new ds.DesktopSmartFileSequencer(),
            "http": new ds.StreamingHttpSequencer()
        });
    }
}

export class OnlineJsoqlEngine extends JsoqlEngine {
    constructor(appBaseUrl : string, getFileStorageKey : (id : string) => string) {
        super({
            "var": new ds.VariableDataSourceSequencer(),
            "file": new ds.OnlineSmartFileSequencer(getFileStorageKey),
            "http": new ds.OnlineStreamingHttpSequencer('http://query.yahooapis.com/v1/public/yql', appBaseUrl)
        });
    }
}