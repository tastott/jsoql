///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import assert = require('assert');
import testBase = require('./testBase');

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function WhereEqualsStringLiteral() {
    var data = [
        { Value: 'A' },
        { Value: 'B' },
        { Value: 'A'  }
    ];
    var expected = [
        { Value: 'B' }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' WHERE Value = 'B'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function WhereEqualsNumber() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var expected = [
        { Value: 2 }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' WHERE Value = 2", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function WhereEqualsAnd() {
    var data = [
        { Value: 'A', Something: 1 },
        { Value: 'B', Something: 1 },
        { Value: 'A', Something: 2 }
    ];
    var expected = [
        { Value: 'A' }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' WHERE Value = 'A' AND Something = 1", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function WhereGreaterThan() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var expected = [
        { Value: 3 }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' WHERE Value > 2", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function WhereLessThan() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: -3 }
    ];
    var expected = [
        { Value: 1 },
        { Value: -3 }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' WHERE Value < 2", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function WhereNotEqualStringLiteral() {
    var data = [
        { Value: 'A' },
        { Value: 'B' },
        { Value: 'A' }
    ];
    var expected = [
        { Value: 'A' },
        { Value: 'A' }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' WHERE Value != 'B'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function WhereNotEqualNumber() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var expected = [
        { Value: 1 },
        { Value: 3 }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' WHERE Value != 2", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function WhereOr() {
    var data = [
        { Value: 'A' },
        { Value: 'B' },
        { Value: 'C' }
    ];
    var expected = [
        { Value: 'A' },
        { Value: 'C' }
    ];
    return testBase.ExecuteArrayQuery("SELECT Value FROM 'var://Test' WHERE Value = 'A' OR Value = 'C'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}
