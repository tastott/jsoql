import Q = require('q')
import p = require('./parse')
import q = require('./query')
import m = require('./models')
import ds = require('./datasource')
import e = require('./engine')
import utils = require('./utilities')

enum Scope {
    Base,
    Grouped,
    Unknown
}

export class QueryHelper {
    constructor(private queryEngine: e.JsoqlEngine) {
    }

    GetQueryHelp(jsoql: string, cursorIndex: number, context?: m.QueryContext): Q.Promise<m.HelpResult> {
        if (!jsoql || cursorIndex >= jsoql.length) return Q({ PropertiesInScope: null });

        var statement = p.ParseHelpful(jsoql);
        console.log('\n');
        console.log('Cursor index: ' + cursorIndex);
  

        //Determine scope at cursor
        var cursor = GetPosition(cursorIndex, jsoql);
        var scope: Scope;
        if (In(cursor, statement.Positions.Select)
            || Between(cursor, statement.Positions.Select, statement.Positions.FromWhere)) {
            scope = Scope.Base;
        }
        else {
            scope = Scope.Unknown;
        }

        console.log('\nCursor position: ');
        console.log(cursor);

        console.log('\nCursor scope: ' + Scope[scope]);

        console.log('\n');
        console.log(statement);

        return this.GetScopeHelp(statement, scope, context);
    }

    private GetPropertiesFromItems(items: any[], result? : any) {

        result = result || {};
        items.forEach(item => this.CollectPropertiesFromItem(item, result));
        return result;
    }

    private CollectPropertiesFromItem(item: any, result: any) {
        if (item instanceof Object) {
            Object.keys(item).forEach(key => {
                var value = item[key];
                if (utils.IsArray(value)) {
                    result[key] = [{}];
                    this.GetPropertiesFromItems(value, result[key][0]);
                }
                else if (value instanceof Object) {
                    result[key] = {};
                    this.CollectPropertiesFromItem(value, result[key]);
                } else result[key] = true;
            });
        } 
    }


    private GetScopeHelp(originalStatement: p.Statement, scope: Scope, context?: m.QueryContext): Q.Promise<m.HelpResult> {

        var helpItems = 8;

        switch (scope) {
            case Scope.Base:
                //Build a new statement: SELECT TOP X * FROM [originalStatement datasources]
                var helpStatement: p.Statement = {
                    Select: {
                        SelectList: [{ Expression: { Property: '*' } }],
                        Limit: 8
                    },
                    FromWhere: originalStatement.FromWhere
                }

                //Get the items
                return this.queryEngine.ExecuteQuery(helpStatement, context)
                    .then(result => {
                        return {
                            PropertiesInScope: this.GetPropertiesFromItems(result.Results)
                        }
                    });

                break;
            default:
                throw new Error("Scope not supported: " + Scope[scope]);
        }
    }
}

interface Position {
    Column: number;
    Line: number;
}

function GetPosition(cursor: number, text: string) : Position {

    if (!text || cursor < 0 || cursor >= text.length) throw new Error("Cursor is outside text");

    var line = 0;
    var searchFrom = 0;
    var column = 0;

    while (true) {
        column = cursor - searchFrom;
        searchFrom = text.indexOf('\n', searchFrom);
        if (searchFrom < 0 || searchFrom > cursor) break;
        ++line;
    }

    return {
        Column: column,
        Line: line
    };
}

function In(position : Position, range: p.Range): boolean {

    return position.Line >= range.first_line
        && position.Line <= range.last_line
        && position.Column >= range.first_column
        && position.Column <= range.last_column;
}

function Between(position: Position, rangeFrom: p.Range, rangeTo: p.Range) {
    return !In(position, rangeFrom)
        && !In(position, rangeTo)
        && position.Line >= rangeFrom.last_line
        && position.Line <= rangeTo.first_line;
}