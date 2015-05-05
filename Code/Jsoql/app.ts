import jsoql = require('./jsoql')
var args = require('minimist')(process.argv.slice(2));

var query = args['q'];

if (!query) console.log('No query argument!');

jsoql.ExecuteQuery(query)
    .then(results => {
        console.log('\n' + query);
        console.log('\n\nNumber of results: ' + results.Results.length);
        console.log('\n\nResults:\n');
        console.log(results.Results);
    })
    .fail(error => console.log(error));

