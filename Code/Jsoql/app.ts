import eng = require('./Scripts/engine')
import http = require('http');
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

var engine = new eng.DesktopJsoqlEngine();

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

