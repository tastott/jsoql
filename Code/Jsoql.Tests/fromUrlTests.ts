///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import testBase = require('./testBase')
import assert = require('assert');
var Jsoql: JsoqlStatic = require('../Jsoql/jsoql');
    
//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function FromUrl() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var jsoql = "SELECT * FROM 'http://localhost:8000/whatever.json'";

    return testBase.ExecuteAndAssertWithServer(jsoql, data, 8000, results => assert.deepEqual(results, data));
}
