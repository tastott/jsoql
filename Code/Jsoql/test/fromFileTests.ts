import path = require('path');
import assert = require('assert');
import testBase = require('./testBase')
    
//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545


describe('fromFileTests', () => {
    it('FromRelativeFileWithNoSpecifiedBaseDirectory', () => {

        var jsoql = "SELECT Order.Id FROM 'file://Data/orders.jsonl'";
        return testBase.ExecuteAndAssertItems(jsoql, null,
            results => assert.equal(results.length, 20));
    })

    it('FromRelativeFileWithSpecifiedBaseDirectory', () => {

        var baseDirectory = path.join(process.cwd(), 'Data');

        var jsoql = "SELECT Order.Id FROM 'file://orders.jsonl'";
        return testBase.ExecuteAndAssertItems(jsoql, { BaseDirectory: baseDirectory },
            results => assert.equal(results.length, 20));

    })

    it('FromAbsoluteFile', () => {

        var absolutePath = path.join(process.cwd(), 'Data/orders.jsonl');

        var jsoql = "SELECT Order.Id FROM 'file://" + absolutePath + "'";
        return testBase.ExecuteAndAssertItems(jsoql, null,
            results => assert.equal(results.length, 20));
    })

    it('ErrorReturnedForQueryOnNonExistentFile', done => {

        var query = "SELECT * FROM 'file://doesnotexist.json'";
        testBase.ExecuteAndAssertFail(query, null, done);
    })

    it('ErrorReturnedForBadJsonlData', done => {

        var query = "SELECT * FROM 'file://../Data/customers-bad.jsonl'";
        testBase.ExecuteAndAssertFail(query, null, done);
    })

    it('ErrorReturnedForBadJsonData', done => {

        var query = "SELECT * FROM 'file://../Data/orders-bad.json'";
        testBase.ExecuteAndAssertFail(query, null, done);
    })
})