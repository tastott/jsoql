///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

var Jsoql = require('../Jsoql/jsoql') //Bit of a workaround to speed development

//var jql = "SELECT Order.ShipCountry AS Country, COUNT() AS Orders FROM './data/orders.jsons' GROUP BY Order.ShipCountry";
//var jsoql = "SELECT c.CompanyName AS Name, SUM(o.OrderDetails[0].Quantity) AS TotalOrderQuantity FROM './data/orders.jsons' AS o JOIN './data/customers.jsons' AS c ON o.Order.CustomerId = c.Id GROUP BY c.CompanyName";
//var jql = "SELECT COUNT() FROM 'Test'";
//var jql = "SELECT Order.CustomerId, SUM(OrderDetails[0].Quantity) AS TotalOrderQuantity FROM './data/orders.jsons' GROUP BY Order.CustomerId";
var jsoql = "SELECT Order.CustomerId FROM './data/orders.jsons'";

var stmt = Jsoql.Parse.Parse(jsoql);

console.log('\n\nQueryw:');
console.log(jsoql);
console.log('\n\nParsed:');
console.log(stmt);
console.log('\n\nResults:');

var query : JsoqlModule.Query.JsoqlQuery = new Jsoql.Query.JsoqlQuery(stmt); //, new _query.ArrayDataSource([{}, {}]));
query.Execute()
    .then(results => {
    if (results.length == 0) console.log('Query returned no results');
    else {
        results.forEach(result => {
            console.log(result);
        });
    }
});

process.stdin.read();

//WARNING: There is apparently a bug at Line 5527 of \node_modules\lazy.js\lazy.js (not in source control)
//         Remove/comment that line and things should work