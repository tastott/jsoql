import fs = require('fs')
import lazy = require('lazy.js')
import parser = require('./Scripts/parser')

var file = './example.log';

function LazyQuery() {
    lazy.readFile(file, 'utf8')
    //.tap(chunk => console.log(chunk))
        .split('\n')
        .map(line => {
        try {
            return JSON.parse(line);
        }
        catch (err) {
            console.log('Failed to parse line: ' + line);
            return {};
        }
    })
        .filter(entry => entry.message && entry.message.match(/Finished power curve capture/))
    //.first(3)
        .map(entry => {
        return {
            time: entry.timestamp,
            curve: entry.curve
        };
    })
        .each(line => {
        console.log(line);
    });
}

export interface WhereClause {
    Operator: string;
    Args: any[]
};

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

    private Evaluate(selectable: any, target: any) {
        if (selectable.Operator) {
            var args = selectable.Args.map(arg => this.Evaluate(arg, target)[1]);
            return ['', this.DoOperation(selectable.Operator, args)];
        }
        if (selectable.Property) {
            if (selectable.Child) return this.Evaluate(selectable.Child, target[selectable.Property]);
            else return [selectable.Property, target[selectable.Property]];
        }
        else if (selectable.Quoted) return ['', selectable.Quoted];
        else return ['', selectable];
    }

    Where(whereClause: WhereClause): JqlQuery {

        return new JqlQuery(
            this.sequence.filter(item => {
                return this.Evaluate(whereClause, item)[1];
            })
        );
    }

    Select(selectables: any[]): LazyJS.Sequence<any>{
        return this.sequence
            .map(item => {
                return lazy(selectables)
                    .map(selectable => this.Evaluate(selectable, item))
                    .toObject();
            });
    }

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
}

interface Statement {
    Select: any[];
    From: any;
    Where: WhereClause;
}

var jql = "SELECT name FROM './example.jsons' WHERE isTasty = false AND colour != 'red'";
var stmt : Statement = parser.Parse(jql);

console.log('\n\nQuery:');
console.log(jql);
console.log('\n\nParsed:');
console.log(stmt);
console.log('\n\nResults:');

JqlQuery.From(stmt.From)
    .Where(stmt.Where)
    .Select(stmt.Select)
    .each(item => console.log(item));


process.stdin.read();

//