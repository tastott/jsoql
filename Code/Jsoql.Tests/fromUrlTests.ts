///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import testBase = require('./testBase')
import assert = require('assert');
import fs = require('fs')
import Q = require('q')

var readFilePromised : (filename:string, encoding:string) => Q.Promise<string> = Q.denodeify<string>(fs.readFile);

export function FromUrl() {

    var jsoql = "SELECT * FROM 'http://localhost:8000/whatever.json'";

    return readFilePromised('./Data/orders.json', 'utf8')
        .then(json => JSON.parse(json))
        .then(data => testBase.ExecuteAndAssertWithServer(jsoql, data, 8000, results => assert.deepEqual(results, data)))
        .fail(error => setTimeout(() => assert.fail(null, null, error)));
}

export function FromUrlWithExplicitRoot() {

    var jsoql = "SELECT * FROM {uri: 'http://localhost:8000/whatever.json', root: 'SomeProperty'}";

    return readFilePromised('./Data/nested-orders.json', 'utf8')
        .then(json => JSON.parse(json))
        .then(data => testBase.ExecuteAndAssertWithServer(jsoql, data, 8000, results => assert.deepEqual(results, data.SomeProperty)))
        .fail(error => setTimeout(() => assert.fail(null, null, error)));
}

export function ErrorReturnedForNonExistentDomain() {
    var query = "SELECT * FROM 'http://669b40f7-41a4-4aa9-90fb-dab6b0c1844f.com/some.json'";
    return testBase.ExecuteAndAssertFail(query, null);
}

export function ErrorReturnedFor404() {
    var query = "SELECT * FROM 'http://www.google.com/669b40f7-41a4-4aa9-90fb-dab6b0c1844f.json'";
    return testBase.ExecuteAndAssertFail(query, null);
}