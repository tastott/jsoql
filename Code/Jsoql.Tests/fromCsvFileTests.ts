///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import path = require('path');
import assert = require('assert');
import testBase = require('./testBase')
    
//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function FromCsvFileWithDefaults() {
    var jsoql = "SELECT * FROM 'file://Data/customers.csv'";
    return testBase.ExecuteAndAssert(jsoql, null,
        results => {
                assert.equal(results.length, 91);
                assert.equal(results[0].Fax, '030-0076545');
        });
}

export function FromCsvFileWithExplicitHeaders() {
    var jsoql = "SELECT * FROM {uri: 'file://Data/customers.csv', headers:'MyHeader1,MyHeader2,MyHeader3'}";
    return testBase.ExecuteAndAssert(jsoql, null,
        results => {
            assert.equal(results.length, 92);
            assert.deepEqual(results[1], {
                MyHeader1: 'ALFKI',
                MyHeader2: 'Alfreds Futterkiste',
                MyHeader3: 'Maria Anders'
            });
        });
}

export function FromCsvFileWithExplicitHeadersAndSkip() {
    var jsoql = "SELECT * FROM {uri: 'file://Data/customers.csv', headers: 'MyHeader1,MyHeader2,MyHeader3', skip:1}";
    return testBase.ExecuteAndAssert(jsoql, null,
        results => {
            assert.equal(results.length, 91);
            assert.deepEqual(results[0], {
                MyHeader1: 'ALFKI',
                MyHeader2: 'Alfreds Futterkiste',
                MyHeader3: 'Maria Anders'
            });
        });
        
}

export function FromCsvFileWithDifferentExtension() {
    var jsoql = "SELECT * FROM {uri: 'file://Data/customers.csv2', format:'csv'}";
    return testBase.ExecuteAndAssert(jsoql, null,
        results => {
            assert.equal(results.length, 91);
            assert.equal(results[0].Fax, '030-0076545');
        });
    
}