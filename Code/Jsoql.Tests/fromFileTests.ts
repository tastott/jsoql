///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import path = require('path');
import assert = require('assert');
import testBase = require('./testBase')
    
//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function FromRelativeFileWithNoSpecifiedBaseDirectory() {
    var jsoql = "SELECT Order.Id FROM 'file://Data/orders.jsonl'";
    return testBase.ExecuteAndAssertItems(jsoql, null,
        results => assert.equal(results.length, 20));
}

export function FromRelativeFileWithSpecifiedBaseDirectory() {
    var baseDirectory = path.join(process.cwd(), 'Data');

    var jsoql = "SELECT Order.Id FROM 'file://orders.jsonl'";
    return testBase.ExecuteAndAssertItems(jsoql, { BaseDirectory: baseDirectory },
        results => assert.equal(results.length, 20));

}

export function FromAbsoluteFile() {
    var absolutePath = path.join(process.cwd() ,'Data/orders.jsonl');
   
    var jsoql = "SELECT Order.Id FROM 'file://" + absolutePath + "'";
    return testBase.ExecuteAndAssertItems(jsoql, null,
        results => assert.equal(results.length, 20));
}

export function ErrorReturnedForQueryOnNonExistentFile() {
    var query = "SELECT * FROM 'file://doesnotexist.json'";
    return testBase.ExecuteAndAssertFail(query, null);
}

export function ErrorReturnedForBadJsonlData() {
    var query = "SELECT * FROM 'file://../Data/customers-bad.jsonl'";
    return testBase.ExecuteAndAssertFail(query, null);
}

export function ErrorReturnedForBadJsonData() {
    var query = "SELECT * FROM 'file://../Data/orders-bad.json'";
    return testBase.ExecuteAndAssertFail(query, null);
}