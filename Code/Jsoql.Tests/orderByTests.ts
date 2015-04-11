///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import assert = require('assert');
import testBase = require('./testBase');

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function OrderByAsc() {
    var data = [3, 1, 2]
        .map(i => {
            return {
                Value: i
            }
        });

    var expected = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' ORDER BY Value ASC", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function OrderByDesc() {
    var data = [3, 1, 2]
        .map(i => {
        return {
            Value: i
        }
    });

    var expected = [
        { Value: 3 },
        { Value: 2 },
        { Value: 1 }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' ORDER BY Value DESC", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function OrderByImplicitAsc() {
    var data = [3, 1, 2]
        .map(i => {
        return {
            Value: i
        }
    });

    var expected = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' ORDER BY Value", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function OrderByMultiple() {
    var data = [
        { Value: 2, Thing: 1 },
        { Value: 1, Thing: 1 },
        { Value: 2, Thing: 3 }
    ];

    var expected = [
        { Value: 1, Thing: 1 },
        { Value: 2, Thing: 1 },
        { Value: 2, Thing: 3 }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value, Thing FROM 'var://Test' ORDER BY Value ASC, Thing ASC", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function OrderByGrouped() {
    var data = [
        { Value: 'A' },
        { Value: 'A' },
        { Value: 'A' },
        { Value: 'C' },
        { Value: 'C' },
        { Value: 'B' }
    ];

    var expected = [
        { Value: 'B'},
        { Value: 'C' },
        { Value: 'A'}
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' GROUP BY Value ORDER BY COUNT()", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}