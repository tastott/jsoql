import assert = require('assert');
import testBase = require('./testBase')


describe('lazyJsonTests', () => {
    it('ArrayRoot', () => {

        var jsoql = "SELECT Order.Id FROM 'file://Data/orders.json'";
        return testBase.ExecuteAndAssertItems(jsoql, null,
            results => assert.equal(results.length, 20));
    })

    it('ArrayPropertyOfObjectRoot', () => {

        var jsoql = "SELECT OrderId FROM {uri: 'file://Data/single-order.json', root: 'OrderDetails'}";
        return testBase.ExecuteAndAssertItems(jsoql, null,
            results => {
                assert.equal(results.length, 1);
                assert.equal(results[0]['OrderId'], 11074);
            });
    })


})