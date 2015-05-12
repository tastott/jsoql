///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import assert = require('assert');
import testBase = require('./testBase');

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function Count() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var expected = [{ COUNT: 3 }];
    return testBase.ExecuteArrayQuery("SELECT COUNT() FROM 'var://Test'", data)
        .then(results => {
            setTimeout(() => assert.deepEqual(results, expected));
        }); 
}

export function Sum() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var expected = [{ SUM: 6 }];
    return testBase.ExecuteArrayQuery("SELECT SUM(Value) FROM 'var://Test'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function Avg() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var expected = [{ AVG: 2 }];
    return testBase.ExecuteArrayQuery("SELECT AVG(Value) FROM 'var://Test'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function GroupBy() {
    var data = [
        { Value: 1, Thing: true },
        { Value: 2, Thing: true },
        { Value: 3, Thing: false}
    ];
    var expected = [
        { Thing: true },
        { Thing: false }
    ];
    return testBase.ExecuteArrayQuery("SELECT Thing FROM 'var://Test' GROUP BY Thing", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function GroupByWithAggregate() {
    var data = [
        { Value: 1, Thing: true },
        { Value: 2, Thing: true },
        { Value: 3, Thing: false }
    ];
    var expected = [
        { Thing: true , Count: 2},
        { Thing: false, Count: 1}
    ];
    return testBase.ExecuteAndAssertDeepEqual("SELECT Thing, COUNT() AS Count FROM 'var://Test' GROUP BY Thing", data, expected);
}

export function WhereGroupBy() {
    var data = [
        { Value: '1', Thing: true },
        { Value: '2', Thing: true },
        { Value: '3', Thing: false }
    ];
    var expected = [
        { Thing: true }
    ];
    return testBase.ExecuteAndAssertDeepEqual("SELECT Thing FROM 'var://Test' WHERE Value != '3' GROUP BY Thing", data, expected);
}
