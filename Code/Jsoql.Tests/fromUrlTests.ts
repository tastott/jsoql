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
