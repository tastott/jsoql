import Q = require('q')
import p = require('./parse')
import q = require('./query')
import m = require('./models')
import ds = require('./datasource')
import e = require('./engine')
import utils = require('./utilities')
var lazy : LazyJS.LazyStatic = require('./Hacks/lazy')

enum Scope {
    Base,
    Grouped,
    Unknown
}

enum Clause {
    Select,
    From,
    Where,
    GroupBy,
    OrderBy,
    Having
}


export class QueryHelper {
    constructor(private queryEngine: e.JsoqlEngine) {
    }

    private GetStatementClauses(statement: p.Statement): {
        Clause: Clause;
        Range: m.Range
    }[]{

        return [
            Clause.Select,
            Clause.From,
            Clause.Where,
            Clause.GroupBy,
            Clause.Having,
            Clause.OrderBy
        ].map(c => {
            return {
                Clause: c,
                JisonRange: statement.Positions[Clause[c]]
            };
        })
        .filter(sc => !!sc.JisonRange)
            .map(sc => {
            return {
                Clause: sc.Clause,
                Range: ConvertJisonRange(sc.JisonRange)
            };
        });
    }

    GetQueryHelp(jsoql: string, cursorPositionOrIndex: m.Position|number, context?: m.QueryContext): Q.Promise<m.HelpResult> {

        if (!jsoql) return Q({ PropertiesInScope: null });

        var cursor: m.Position;
        if (typeof cursorPositionOrIndex === 'number') cursor = GetPosition(cursorPositionOrIndex, jsoql);
        else cursor = cursorPositionOrIndex;

        var statement = p.ParseHelpful(jsoql);
   
        //Determine clause at cursor
        var statementClauses = this.GetStatementClauses(statement);
        var cursorClause = lazy(statementClauses)
            .filter(sc => Compare(cursor, sc.Range.From) < 0)
            .first() || statementClauses.slice(-1)[0];
        
        //Determine scope for this clause
        var scope: Scope;
        if (statementClauses.some(sc => sc.Clause == Clause.GroupBy)) {
            scope = Scope.Unknown;
        } else {
            scope = Scope.Base;
        }

 
    //    if (Before(cursor, statement.Positions.From)) clause = Clause.Select;
    //else if(
    //    {
    //        scope = Scope.Base;
    //    }
    //    else {
    //        scope = Scope.Unknown;
    //    }

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
                    From: originalStatement.From
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

function GetPosition(cursor: number, text: string) : m.Position {

    if (!text || cursor < 0 || cursor > text.length + 1) throw new Error("Cursor is outside text");

    var result: m.Position;
    var lines = text.split('\r?\n');

    for (var i = 0; i < lines.length; i++) {
        if (cursor < lines[i].length) return { Line: i, Column: cursor };
        else cursor -= lines[i].length;
    }
   
    return { Line: cursor === 0 ? i - 1: i, Column: lines[i-1].length };
}

function ConvertJisonRange(range: p.Range): m.Range{
    return {
        From: {
            Column: range.first_column,
            Line: range.first_line
        },
        To: {
            Column: range.last_column,
            Line: range.last_line
        }
    };
}

function Compare(a: m.Position, b: m.Position): number {
    if (a.Line > b.Line) return 1;
    else if (a.Line < b.Line) return -1;
    else if (a.Column > b.Column) return 1;
    else if (a.Column < b.Column) return -1;
    else return 0;
}

//function In(position : m.Position, range: p.Range): boolean {
//    var rangePositions = ToPositions(range);

//    return Compare(position, rangePositions[0]) >= 0
//        && Compare(position, rangePositions[1]) <= 0;
//}

//function Between(position: m.Position, rangeFrom: p.Range, rangeTo: p.Range) {
//    var from = ToPositions(rangeFrom)[1];
//    var to = ToPositions(rangeTo)[0];

//    return Compare(position, from) > 0
//        && Compare(position, to) < 0;
//}

//function After(position: m.Position, range: p.Range): boolean {
//    var rangePositions = ToPositions(range);
//    return Compare(position, rangePositions[1]) > 0;
//}


//function Before(position: m.Position, range: m.Range): boolean {
//    return Compare(position, range.From) < 0;
//}