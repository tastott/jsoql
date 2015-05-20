import assert = require('assert');
import testBase = require('./testBase')

export function ArrayRoot() {
    var jsoql = "SELECT Order.Id FROM 'file://Data/orders.json'";
    return testBase.ExecuteAndAssert(jsoql, null, 
        results => assert.equal(results.length, 20));
}

export function ObjectRoot() {
    var jsoql = "SELECT Order.Id FROM 'file://Data/single-order.json'";
    return testBase.ExecuteAndAssert(jsoql, null, 
        results => {
                assert.equal(results.length, 1);
                assert.equal(results[0]['Order.Id'], 11074);
            });
}

