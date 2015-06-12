import assert = require('assert');
import testBase = require('./testBase')

export function ExpressionCanIncludeEmptyStringLiteral() {
    var data = [
        { Name: 'Bob' },
        { Name: '' }
    ];
    var query = "SELECT Name FROM 'var://Test' WHERE Name = ''";
    var expected = data.slice(-1);
    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function NotOperator() {
    var data = [
        { Name: 'Bob' },
        { Name: 'Jim' }
    ];
    var query = "SELECT Name FROM 'var://Test' WHERE NOT Name = 'Bob'";
    var expected = data.slice(-1);
    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function IsNullOperation() {
    var data = [
        { Name: 'Bob' },
        { Name: null }
    ];
    var query = "SELECT Name FROM 'var://Test' WHERE Name IS NULL";
    var expected = data.slice(-1);
    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function IsUndefinedOperation() {
    var data = [
        { Name: 'Bob' },
        { Blah: 'Wotsit'}
    ];
    var query = "SELECT Blah FROM 'var://Test' WHERE Name IS UNDEFINED";
    var expected = data.slice(-1);
    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function Coalesce() {
    var data = [
        { A: 'Bob', B: 'Dave', C:'Jim' },
        { A: null, B: 'Gary' },
        { A: null, B: undefined, C: 'Bill' }
    ];
    var query = "SELECT COALESCE(A,B,C) AS Name FROM 'var://Test'";
    var expected = [
        { Name: 'Bob' },
        { Name: 'Gary' },
        { Name: 'Bill' }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function Arithmetic() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var query = "SELECT Value * 2 AS Double FROM 'var://Test'";
    var expected = [
        { Double: 2 },
        { Double: 4 },
        { Double: 6 }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function BinaryMinus() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var query = "SELECT Value - 2 AS MinusTwo FROM 'var://Test'";
    var expected = [
        { MinusTwo: -1 },
        { MinusTwo: 0 },
        { MinusTwo: 1 }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function UnaryMinus() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var query = "SELECT -2 + Value AS MinusTwo FROM 'var://Test'";
    var expected = [
        { MinusTwo: -1 },
        { MinusTwo: 0 },
        { MinusTwo: 1 }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function DeepEquals() {
    var data = [
        { Value: { A: 'Blah', B: 'Wotsit' } },
        { Value: 2 },
        { Value: 3 }
    ];
    var query = "SELECT * FROM 'var://Test' WHERE Value = {A: 'Blah', B: 'Wotsit'}";
    var expected = data.slice(0, 1);

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function DeepEqualsWithNesting() {
    var data = [
        { Value: { A: 'Blah', B: 'Wotsit' } },
        { Value: 2 },
        { Value: 3 }
    ];
    var query = "SELECT t.* FROM 'var://Test' AS t WHERE t = {Value: {A: 'Blah', B: 'Wotsit'}}";
    var expected = data.slice(0, 1);

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function DeepEqualsWithArray() {
    var data = [
        { Value: { A: 'Blah', B: [1,2,3] } },
        { Value: 2 },
        { Value: 3 }
    ];
    var query = "SELECT * FROM 'var://Test' WHERE Value = {A: 'Blah', B: [1,2,3]}";
    var expected = data.slice(0, 1);

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function In() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var query = "SELECT * FROM 'var://Test' WHERE Value IN (1,3)";
    var expected = data.slice(0, 1).concat(data.slice(-1));

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function DeepIn() {
    var data = [
        { Value: 1 },
        { Value: 2 },
        { Value: 3 }
    ];
    var query = "SELECT t.* FROM 'var://Test' AS t WHERE t IN ({Value: 1}, {Value: 3})";
    var expected = data.slice(0, 1).concat(data.slice(-1));

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}