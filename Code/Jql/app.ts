import fs = require('fs')
import lazy = require('lazy.js')
import parser = require('./Scripts/parser')
import Q = require('q')

var file = './example.log';

export interface WhereClause {
    Operator: string;
    Args: any[]
};

export interface Group {
    Key: any;
    Items: any[];
}

export class JqlQuery {
    constructor(private stmt : Statement) {
    }

    private DoOperation(operator: string, args: any[]) {
        var func: (args: any[]) => any;

        switch (operator) {
            case '=':
                func = args => args[0] == args[1];
                break;
            case '!=':
                func = args => args[0] !== args[1];
                break;
            case 'AND':
                func = args => args[0] && args[1];
                break;
            default:
                throw 'Unrecognized operator ' + operator;
        }

        return func(args);
    }

    private DoAggregateFunction(name: string, items: any[]){

        switch (name.toLowerCase()) {
            case 'count': return items.length;
            default: throw 'Unrecognized function: ' + name;
        }
    }

    private Evaluate(selectable: any, target: any) {
        if (selectable.Operator) {
            var args = selectable.Args.map(arg => this.Evaluate(arg, target));
            return this.DoOperation(selectable.Operator, args);
        }
        else if (selectable.Property) {
            if (selectable.Child) return this.Evaluate(selectable.Child, target[selectable.Property]);
            else return target[selectable.Property];
        }
        else if (selectable.Quoted) return selectable.Quoted;
        else return selectable;
    }

    private Hash(expression: any): string {
        if (expression.Property) {
            if (expression.Child) return expression.Property + '.' + this.Hash(expression.Child);
            else return expression.Property;
        }
        else if (expression.Call) {
            return expression.Call;
        }
        else return '';
    }

    private EvaluateGroup(expression: any, group : Group) {
        if (JqlQuery.IsAggregate(expression)) {
            return this.DoAggregateFunction(expression.Call, group.Items);
        }
        else if (expression.Property){
            var hash = this.Hash(expression);
            return group.Key[hash];
        }

        /*if (expression.Operator) {
            var args = expression.Args.map(arg => this.Evaluate(arg, target)[1]);
            return ['', this.DoOperation(expression.Operator, args)];
        }
        else if (expression.Property) {
            if (expression.Child) return this.Evaluate(expression.Child, target[expression.Property]);
            else return [expression.Property, target[expression.Property]];
        }
        else if (expression.Quoted) return ['', expression.Quoted];
        else return ['', expression];*/
    }

    Execute(): Q.Promise<any[]> {
        
        //From
        var seq = this.From(this.stmt.From);

        //Where
        if (this.stmt.Where) {
            seq = seq.filter(item => {
                return this.Evaluate(this.stmt.Where, item);
            })
        }

        //Grouping
        //Explicitly
        if (stmt.GroupBy) {
            return this.GroupBy(seq, this.stmt.GroupBy)
                .then(groups => 
                    groups.map(group => 
                            lazy(this.stmt.Select)
                                .map(exp => [this.Hash(exp), this.EvaluateGroup(exp, group)])
                                .toObject()
                            )
                            .toArray()
                );
        }
        //Implicitly
        else if (lazy(stmt.Select).some(exp => JqlQuery.IsAggregate(exp))) {
            return JqlQuery.SequenceToArray(seq)
                .then(items => {
                    var group: Group = {
                        Key: null,
                        Items: items
                    };

                    return [
                        lazy(this.stmt.Select)
                            .map(exp => [this.Hash(exp), this.EvaluateGroup(exp, group)])
                            .toObject()
                    ];
                });

        }
        //No grouping
        else {
            //Select
            seq = seq.map(item => {
                return lazy(this.stmt.Select)
                    .map(selectable => [this.Hash(selectable), this.Evaluate(selectable, item)])
                    .toObject();
            });

            return JqlQuery.SequenceToArray(seq);
        }
    }


    /*Group(): Q.Promise<JqlQuery> {
        return (<any>this.sequence
            .toArray())
            .then(arr => {
                var group: Group = {
                    Items: arr
                };
                return new JqlQuery(lazy([group]));
            });
    }*/


    GroupBy(seq : LazyJS.Sequence<any>, expressions: any[]): Q.Promise<LazyJS.Sequence<Group>>{
        var groupKey = (item: any) => {
            var object = lazy(expressions)
                .map(exp => [this.Hash(exp), this.Evaluate(exp, item)])
                .toObject();

            return JSON.stringify(object);
        };

        return JqlQuery.SequenceToArray(seq)
            .then(items => {
                var grouped = lazy(items).groupBy(groupKey);
                var lazyGroups = grouped.toArray();
                var groups: Group[] = lazyGroups.map(lg => {
                    return {
                        Key: JSON.parse(lg[0]),
                        Items: lg[1]
                    };
                });

                return lazy(groups);
            });
    }

    private From(fromClause: any): LazyJS.Sequence<any> {
        if (fromClause.Quoted != undefined && fromClause.Quoted != null) {
            var file = fromClause.Quoted;
            if (!fs.existsSync(file)) throw 'File not found: ' + file;
            else {
                var seq = lazy.readFile(file, 'utf8')
                    .split('\r\n')
                    .map(line => {
                        //line = '{ "name": "banana", "colour": "yellow", "isTasty": true }';
                        try {
                            return JSON.parse(line);
                        }
                        catch (err) {
                            throw 'Failed to parse line: ' + line;
                        }
                    });
                return seq;
            }
        }
        else throw 'Unquoted from clause not supported';
    }

    static IsAggregate(expression: any) {
        return expression
            && expression.Call
            && expression.Call.toLowerCase() == 'count';
    }

    static SequenceToArray<T>(seq: LazyJS.Sequence<T>): Q.Promise<T[]> {
        var arrayPromise: any = seq.toArray();

        if (typeof arrayPromise == 'Array') return Q(arrayPromise);
        else return arrayPromise;
    }
}

interface Statement {
    Select: any[];
    From: any;
    Where: WhereClause;
    GroupBy: any;
}

var jql = "SELECT isTasty, colour, COUNT() FROM './example.jsons' GROUP BY isTasty, colour";
var stmt : Statement = parser.Parse(jql);

console.log('\n\nQuery:');
console.log(jql);
console.log('\n\nParsed:');
console.log(stmt);
console.log('\n\nResults:');

var query = new JqlQuery(stmt);
query.Execute()
    .then(results => {
        results.forEach(result => {
            console.log(result);
        });
    });

process.stdin.read();

//