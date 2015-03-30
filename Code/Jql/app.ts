import fs = require('fs')
import lazy = require('lazy.js')

var file = './example.log';

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


process.stdin.read();

//SELECT timestamp, curve.Fit FROM 'path/to/file' WHERE Message = 'Finished power curve capture'