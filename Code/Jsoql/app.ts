import eng = require('./Scripts/engine')
import http = require('http');
import fs = require('fs')

var args = require('minimist')(process.argv.slice(2));

var query = args['q'];

if (!query) console.log('No query argument!');

if (args['w']){
    var data = [
        { Value: 1 },
        { Value: 2 }
    ];
   
    var server = http.createServer((req, res) => {
        res.write(JSON.stringify(data));
        res.end();
    });

    server.listen(parseInt(args['w']));

    process.on('exit',() => {
        server.close();
    });
}

//var engine = new eng.DesktopJsoqlEngine();
var engine = new eng.OnlineJsoqlEngine('http://www.whateverorigin.org');


console.log('\n' + query);

engine.ExecuteQuery(query)
    .then(results => {

        if (results.Errors && results.Errors.length) {
            console.log(results.Errors);
        }
        else {
            console.log('\n\nNumber of results: ' + results.Results.length);
            console.log('\n\nResults:\n');
            console.log(results.Results);
        }
    })
    .fail(error => console.log(error));


//var replaceStream = require('replacestream')

//var url = 'http://www.whateverorigin.org/get?url=http%3A%2F%2Fnorthwind.servicestack.net%2Fcustomers.json&callback=callback';

//require('http').get(url, stream => {
//    var transformed = stream
//        .pipe(replaceStream(/^callback\(/, ''))
//        .pipe(replaceStream(/\)$/, ''))
//        .pipe(replaceStream(/\\"/g, ''));

//    transformed.pause();

//    require('oboe')(transformed)
//        .node('Customers', data => {
//            console.log(data);
//        })
//        .fail(error => console.log(error))
//        .done(blah => console.log(blah));

//    transformed.resume();
//});

