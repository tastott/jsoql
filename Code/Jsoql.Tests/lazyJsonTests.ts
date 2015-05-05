import assert = require('assert');
var Jsoql: JsoqlStatic = require('../Jsoql/jsoql');

export function ArrayRoot() {
    var jsoql = "SELECT Order.Id FROM 'file://Data/orders.json'";
    return Jsoql.ExecuteQuery(jsoql)
        .then(result => {
            setTimeout(() => assert.equal(result.Results.length, 20));
        })
        .fail(error => {
            setTimeout(() => assert.fail(null, null, error));
        });
}

