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

export class JqlQuery {
    constructor(private sequence: LazyJS.Sequence<any>) {
    }

    private DoSelectable(selectable: any, target: any) {
        if (selectable.Child) return this.DoSelectable(selectable.Child, target[selectable.Property]);
        else return [selectable.Property, target[selectable.Property]];
    }

    Where(whereClause: any): JqlQuery {
        return this;
    }

    Select(selectables: any[]): LazyJS.Sequence<any>{
        return this.sequence
            .map(item => {
                return lazy(selectables)
                    .map(selectable => this.DoSelectable(selectable, item))
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
    Where: any;
}

var jql = "SELECT name, colour, isTasty FROM './example.jsons' WHERE isTasty = true";
var stmt : Statement = parser.Parse(jql);


console.log(stmt);

JqlQuery.From(stmt.From)
    .Select(stmt.Select)
    .each(item => console.log(item));


process.stdin.read();

//