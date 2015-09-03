///<reference path="../typings/mocha/mocha.d.ts" /> 
import path = require('path');
import assert = require('assert');
import testBase = require('./testBase')
    
//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545


describe('fromCsvFileTests', function(){
    this.timeout(5000)

    it('FromCsvFileWithDefaults', () => {

        var jsoql = "SELECT * FROM 'file://Data/customers.csv'";
        return testBase.ExecuteAndAssertItems(jsoql, null,
            results => {
                assert.equal(results.length, 91);
                assert.equal(results[0].Fax, '030-0076545');
            });
    })

    it('FromCsvFileWithExplicitHeaders', () => {

        var jsoql = "SELECT * FROM {uri: 'file://Data/customers.csv', headers:'MyHeader1,MyHeader2,MyHeader3'}";
        return testBase.ExecuteAndAssertItems(jsoql, null,
            results => {
                assert.equal(results.length, 92);
                assert.deepEqual(results[1], {
                    MyHeader1: 'ALFKI',
                    MyHeader2: 'Alfreds Futterkiste',
                    MyHeader3: 'Maria Anders'
                });
            });
    })

    it('FromCsvFileWithExplicitHeadersAndSkip', () => {

        var jsoql = "SELECT * FROM {uri: 'file://Data/customers.csv', headers: 'MyHeader1,MyHeader2,MyHeader3', skip:1}";
        return testBase.ExecuteAndAssertItems(jsoql, null,
            results => {
                assert.equal(results.length, 91);
                assert.deepEqual(results[0], {
                    MyHeader1: 'ALFKI',
                    MyHeader2: 'Alfreds Futterkiste',
                    MyHeader3: 'Maria Anders'
                });
            });

    })

    it('FromCsvFileWithDifferentExtension', () => {

        var jsoql = "SELECT * FROM {uri: 'file://Data/customers.csv2', format:'csv'}";
        return testBase.ExecuteAndAssertItems(jsoql, null,
            results => {
                assert.equal(results.length, 91);
                assert.equal(results[0].Fax, '030-0076545');
            });

    })

    it('FromCsvFileWithQuotedNewlines', () => {

        var jsoql = "SELECT * FROM 'file://Data/customers-with-newlines.csv'";
        return testBase.ExecuteAndAssertItems(jsoql, null,
            results => {
                assert.equal(results.length, 91);
                assert.equal(results[17].Address, '67,\r\nrue des Cinquante Otages');
            });

    })

    it('FromCsvFileLazy', () => {

        var jsoql = "SELECT * FROM 'file://Data/baseball-players.csv'";
        return testBase.ExecuteLazyToCompletionAndAssert(jsoql,
            result => {
                assert.equal(result.Iterator.AvailableItems(), 18589);
            });
    })

})