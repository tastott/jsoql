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
    Items: any[];
}

export class JqlQuery {
    constructor(private sequence: LazyJS.Sequence<any>) {
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
        if (JqlQuery.IsAggregate(selectable)) {
            var group: Group = target;
            return [selectable.Call, this.DoAggregateFunction(selectable.Call, group.Items)];
        }
        if (selectable.Operator) {
            var args = selectable.Args.map(arg => this.Evaluate(arg, target)[1]);
            return ['', this.DoOperation(selectable.Operator, args)];
        }
        else if (selectable.Property) {
            if (selectable.Child) return this.Evaluate(selectable.Child, target[selectable.Property]);
            else return [selectable.Property, target[selectable.Property]];
        }
        else if (selectable.Quoted) return ['', selectable.Quoted];
        else return ['', selectable];
    }

    Where(whereClause: WhereClause): JqlQuery {

        if (whereClause)
            return new JqlQuery(
                this.sequence.filter(item => {
                    return this.Evaluate(whereClause, item)[1];
                })
            );
        else
            return new JqlQuery(this.sequence);

    }

    Select(selectables: any[]): LazyJS.Sequence<any>{
        return this.sequence
            .map(item => {
                return lazy(selectables)
                    .map(selectable => this.Evaluate(selectable, item))
                    .toObject();
            });
    }

    Group(): Q.Promise<JqlQuery> {
        return (<any>this.sequence
            .toArray())
            .then(arr => {
                var group: Group = {
                    Items: arr
                };
                return new JqlQuery(lazy([group]));
            });
    }


    //GroupBy(groupBy: any): LazyJS.Sequence<Group>{
    //    return this.sequence
    //        .groupBy(
    //}

    static From(fromClause: any): JqlQuery {
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
                return new JqlQuery(seq);
            }
        }
        else throw 'Unquoted from clause not supported';
    }

    static IsAggregate(expression: any) {
        return expression
            && expression.Call
            && expression.Call.toLowerCase() == 'count';
    }
}

interface Statement {
    Select: any[];
    From: any;
    Where: WhereClause;
}

var jql = "SELECT COUNT() FROM './example.jsons' WHERE isTasty = false";
var stmt : Statement = parser.Parse(jql);

console.log('\n\nQuery:');
console.log(jql);
console.log('\n\nParsed:');
console.log(stmt);
console.log('\n\nResults:');

var implicitGroupAll = lazy(stmt.Select)
    .filter(exp => JqlQuery.IsAggregate(exp))
    .size();

var fromWhere = JqlQuery.From(stmt.From)
    .Where(stmt.Where);

if (implicitGroupAll) {
    fromWhere.Group()
        .then(grouped => {
            grouped.Select(stmt.Select)
                .each(item => console.log(item));
        });
}

else {
    fromWhere.Select(stmt.Select)
        .each(item => console.log(item));
}



process.stdin.read();

//