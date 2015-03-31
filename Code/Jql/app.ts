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

function From(fromClause: any): LazyJS.Sequence<any> {

    if (fromClause.Quoted != undefined && fromClause.Quoted != null) {
        var file = fromClause.Quoted;
        if (!fs.existsSync(file)) throw 'File not found: ' + file;
        else {
            return lazy.readFile(file, 'utf8')
                .split('\n')
                .map(line => {
                    try {
                        return JSON.parse(line);
                    }
                    catch (err) {
                        throw 'Failed to parse line: ' + line;
                    }
                })
        }
    }
    else throw 'Unquoted from clause not supported';

}

function Select(selectables: any[]): (source: any) => any {

    return source => {
        return Lazy(selectables)
            .map(GetSelectableKeyValue)
            .toObject();
    };

}

function GetSelectableKeyValue(selectable: any, source : any) {
    if (selectable.Child) {
        var childKv = GetSelectableKeyValue(selectable.Child);
        return [childKv[0], selectable.Property + '.' + childKv[1]];
    }
    else return [selectable.Property, selectable.Property];
}

interface Statement {
    Select: any[];
    From: any;
    Where: any;
}

var jql = "SELECT timestamp, curve.Fit FROM './example.log' WHERE Message = 'Finished power curve capture'"
var stmt : Statement = parser.Parse(jql);


console.log(stmt + '\n\n');

From(stmt.From)
    .first(2)
    .each(entry => console.log(entry));

var thing = {
    blah: {
        wotsit: 0
    }
};

console.log(thing['blah.wotsit']);

process.stdin.read();

//