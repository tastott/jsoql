///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import assert = require('assert');
import testBase = require('./testBase');

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function ExpressionAlias() {
    var data = [
        { Value: 1 }
    ];
    var expected = [{ Blah: 1}];
    return testBase.ExecuteArrayQuery("SELECT Value AS Blah FROM 'var://Test'", data)
        .then(results => {
            setTimeout(() => assert.deepEqual(results, expected));
        }); 
}

export function NestedProperty() {
    var data = [1, 2, 3].map(i => {
        return {
            Thing: {
                Value: i
            }
        };
    });
    var expected = [
        { "Thing.Value": 1 },
        { "Thing.Value": 2 },
        { "Thing.Value": 3 }
    ];
    return testBase.ExecuteArrayQuery("SELECT Thing.Value FROM 'var://Test'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function NonUniversalProperty() {
    var data = [
        { Thing: 1 },
        { Blah: 2 }
    ];
    var expected = [
        { Thing: 1 },
        { Thing: undefined }
    ];
    return testBase.ExecuteArrayQuery("SELECT Thing FROM 'var://Test'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function NonUniversalParentProperty() {
    var data = [
        { Thing: { A: 1 }},
        { Blah: 1 }
    ];
    var expected = [
        { "Thing.A": 1 },
        { "Thing.A": undefined }
    ];
    return testBase.ExecuteArrayQuery("SELECT Thing.A FROM 'var://Test'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function NonUniversalChildProperty() {
    var data = [
        { Thing: { A: 1 } },
        { Thing: 1 }
    ];
    var expected = [
        { "Thing.A": 1 },
        { "Thing.A": undefined }
    ];
    return testBase.ExecuteArrayQuery("SELECT Thing.A FROM 'var://Test'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function SelectObject() {
    var data = [1, 2, 3].map(i => {
        return {
            Thing: {
                Value: i
            }
        };
    });
    var expected = [
        { Thing: {Value: 1 } },
        { Thing: { Value: 2 } },
        { Thing: { Value: 3} }
    ];
    return testBase.ExecuteArrayQuery("SELECT Thing FROM 'var://Test'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function ArrayProperty() {
    var data = [1, 2, 3].map(i => {
        return {
            Thing: {
                Value: [i, i + 0.1, i + 0.2]
            }
        };
    });
    var expected = [
        { "Thing.Value[1]": 1.1 },
        { "Thing.Value[1]": 2.1 },
        { "Thing.Value[1]": 3.1 }
    ];
    return testBase.ExecuteArrayQuery("SELECT Thing.Value[1] FROM 'var://Test'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}


export function SelectStar() {
    var data = [
        { Value: 'A', Child: { Thing: 1 }},
        { Value: 'B', Child: { Blah: 2 } },
        { Value: 'C' , Children: [1,2,3]}
    ];
    
    return testBase.ExecuteArrayQuery("SELECT * FROM 'var://Test'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, data));
    });
}

export function SelectNestedStar() {
    var data = [
        { Value: 'A', Child: { Thing: 1, Test: 'blah'  } },
        { Value: 'B', Child: { Blah: 2 } },
        { Value: 'C', Children: [1, 2, 3] }
    ];

    var expected = [
        { Thing: 1, Test: 'blah' },
        { Blah: 2 },
        {}
    ];

    return testBase.ExecuteArrayQuery("SELECT Child.* FROM 'var://Test'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}

export function SelectTopX() {
    var data = [1, 2, 3, 4, 5, 6, 7, 8].map(n => {
        return {
            Value: n
        };
    });

    var expected = data.slice(0, 3);

    return testBase.ExecuteArrayQuery("SELECT TOP 3 Value FROM 'var://Test'", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}