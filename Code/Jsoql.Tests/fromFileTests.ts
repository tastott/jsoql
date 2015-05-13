///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import path = require('path');
import assert = require('assert');
var Jsoql: JsoqlStatic = require('../Jsoql/jsoql');
    
//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function FromRelativeFileWithNoSpecifiedBaseDirectory() {
    var jsoql = "SELECT Order.Id FROM 'file://Data/orders.jsonl'";
    return Jsoql.ExecuteQuery(jsoql)
        .then(result => {
            setTimeout(() => assert.equal(result.Results.length, 20));
        })
        .fail(error => {
            setTimeout(() => assert.fail(null, null, error));
        });
}

export function FromRelativeFileWithSpecifiedBaseDirectory() {
    var baseDirectory = path.join(process.cwd() ,'Data');

    var jsoql = "SELECT Order.Id FROM 'file://orders.jsonl'";
    return Jsoql.ExecuteQuery(jsoql, { BaseDirectory: baseDirectory })
        .then(result => {
            setTimeout(() => assert.equal(result.Results.length, 20));
        })
        .fail(error => {
            setTimeout(() => assert.fail(null, null, error));
        });
}

export function FromAbsoluteFile() {
    var absolutePath = path.join(process.cwd() ,'Data/orders.jsonl');
   
    var jsoql = "SELECT Order.Id FROM 'file://" + absolutePath + "'";
    return Jsoql.ExecuteQuery(jsoql)
        .then(result => {
            setTimeout(() => assert.equal(result.Results.length, 20));
        })
        .fail(error => {
            setTimeout(() => assert.fail(null, null, error));
        });
}