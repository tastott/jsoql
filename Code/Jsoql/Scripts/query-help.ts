import Q = require('q')
import p = require('./parse')
import q = require('./query')
import m = require('./models')
import ds = require('./datasource')
import utils = require('./utilities')
import evl = require('./evaluate')
var clone = require('clone')
var lazy : LazyJS.LazyStatic = require('./Hacks/lazy')

enum Scope {
    Base,
    Grouped,
    BaseFrom,
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
    constructor(private queryEngine: m.JsoqlEngine) {
    }

    private GetStatementClauses(statement: m.Statement): {
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
        var cursorClause: Clause;

        lazy(statementClauses).some(sc => {
            if (Compare(cursor, sc.Range.From) < 0) return true;
            else {
                cursorClause = sc.Clause;
                return false;
            }
        });
   
        //Determine scope for this clause
        var scope: Scope;
        if (statementClauses.some(sc => sc.Clause == Clause.GroupBy)) {

            switch (cursorClause) {
                case Clause.Where:
                case Clause.GroupBy:
                    scope = Scope.Base;
                    break;
                default:
                    scope = Scope.Grouped;
                    break;
            }
        } else {
            scope = Scope.Base;
        }

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

    private MungeFromClause(fromClauseNode: m.FromClauseNode) {
        var cloned = clone(fromClauseNode);
        this.MungeFromClauseRecursive(cloned);
        return cloned;
    }

    private MungeFromClauseRecursive(fromClauseNode: m.FromClauseNode) {
        if (fromClauseNode.Expression !== undefined) {
            fromClauseNode.Expression = true;
        }

        if (fromClauseNode.Left) this.MungeFromClause(fromClauseNode.Left);
        if (fromClauseNode.Right) this.MungeFromClause(fromClauseNode.Right);
    }

    private GetScopeHelp(originalStatement: m.Statement, scope: Scope, context?: m.QueryContext): Q.Promise<m.HelpResult> {

        var helpItems = 8;

        switch (scope) {
            case Scope.Base:
                //Build a new statement: SELECT TOP X * FROM [originalStatement datasources with any joins fudged]
                //We'll munge the from clause a bit to try and get some data:
                //  - make all the JOIN conditions true
                //  - back out of any incomplete OVERs
                var mungedFrom = this.MungeFromClause(originalStatement.From);

                var helpStatement: m.Statement = {
                    Select: {
                        SelectList: [{ Expression: { Property: '*' } }],
                        Limit: 8
                    },
                    From: mungedFrom
                }

                //Get the items
                var results = this.queryEngine.ExecuteQuery(helpStatement, context);

                if (!results.Errors || !results.Errors.length) {
                    return results.Iterator
                        .GetAll()
                        .then(results => {
                            return {
                                PropertiesInScope: this.GetPropertiesFromItems(results)
                            }
                        });
                }
                else return Q({ PropertiesInScope: {} });
                break;

            case Scope.Grouped:
                //Find "straight up" property chains (i.e. not part of an expression) in the GROUP BY clause
                //Return the whole chain as a string because only the whole thing makes sense as a suggestion
                var groupProperties = lazy(originalStatement.GroupBy.Groupings)
                    .filter(g => g.Property)
                    .map(topProp => [evl.Evaluator.Key(topProp), true])
                    .toObject();
                    

                return Q({ PropertiesInScope: groupProperties});
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

function ConvertJisonRange(range: m.JisonRange): m.Range{
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