///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import path = require('path');
import assert = require('assert');
var Jsoql: JsoqlStatic = require('../Jsoql/jsoql');
    
//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function FromCsvFileWithDefaults() {
    var jsoql = "SELECT * FROM 'file://Data/customers.csv'";
    return Jsoql.ExecuteQuery(jsoql)
        .then(result => {
            setTimeout(() => {
                assert.equal(result.Results.length, 91);
                assert.equal(result.Results[0].Fax, '030-0076545');
            });
        })
        .fail(error => {
            setTimeout(() => assert.fail(null, null, error));
        });
}

export function FromCsvFileWithExplicitHeaders() {
    var jsoql = "SELECT * FROM 'file://Data/customers.csv?headers=MyHeader1,MyHeader2,MyHeader3'";
    return Jsoql.ExecuteQuery(jsoql)
        .then(result => {
            setTimeout(() => {
                assert.equal(result.Results.length, 92);
                assert.deepEqual(result.Results[1], {
                    MyHeader1: 'ALFKI',
                    MyHeader2: 'Alfreds Futterkiste',
                    MyHeader3: 'Maria Anders'
                });
            });
        })
        .fail(error => {
            setTimeout(() => assert.fail(null, null, error));
        });
}

export function FromCsvFileWithExplicitHeadersAndSkip() {
    var jsoql = "SELECT * FROM 'file://Data/customers.csv?headers=MyHeader1,MyHeader2,MyHeader3&skip=1'";
    return Jsoql.ExecuteQuery(jsoql)
        .then(result => {
        setTimeout(() => {
            assert.equal(result.Results.length, 91);
            assert.deepEqual(result.Results[0], {
                MyHeader1: 'ALFKI',
                MyHeader2: 'Alfreds Futterkiste',
                MyHeader3: 'Maria Anders'
            });
        });
    })
        .fail(error => {
        setTimeout(() => assert.fail(null, null, error));
    });
}

export function FromCsvFileWithDifferentExtension() {
    var jsoql = "SELECT * FROM 'file://Data/customers.csv2?format=csv'";
    return Jsoql.ExecuteQuery(jsoql)
        .then(result => {
        setTimeout(() => {
            assert.equal(result.Results.length, 91);
            assert.equal(result.Results[0].Fax, '030-0076545');
        });
    })
        .fail(error => {
        setTimeout(() => assert.fail(null, null, error));
    });
}