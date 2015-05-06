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

export function ObjectRoot() {
    var jsoql = "SELECT Order.Id FROM 'file://Data/single-order.json'";
    return Jsoql.ExecuteQuery(jsoql)
        .then(result => {
            setTimeout(() => {
                assert.equal(result.Results.length, 1);
                assert.equal(result.Results[0]['Order.Id'], 11074);
            });
        })
        .fail(error => {
            setTimeout(() => assert.fail(null, null, error));
        });
}

