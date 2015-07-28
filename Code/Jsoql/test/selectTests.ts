﻿import assert = require('assert');
import testBase = require('./testBase');

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function ExpressionAlias() {
    var data = [
        { Value: 1 }
    ];
    var expected = [{ Blah: 1}];
    return testBase.ExecuteAndAssertDeepEqual("SELECT Value AS Blah FROM 'var://Test'", data, expected);
}

export function JsonPropertySyntax() {
    var data = [
        { Value: 1 }
    ];
    var expected = [{ Blah: 1 }];
    return testBase.ExecuteAndAssertDeepEqual("SELECT \"Blah\": Value FROM 'var://Test'", data, expected);
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
    return testBase.ExecuteAndAssertDeepEqual("SELECT Thing.Value FROM 'var://Test'", data, expected);
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
    return testBase.ExecuteAndAssertDeepEqual("SELECT Thing FROM 'var://Test'", data, expected);
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
    return testBase.ExecuteAndAssertDeepEqual("SELECT Thing.A FROM 'var://Test'", data, expected);
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
    return testBase.ExecuteAndAssertDeepEqual("SELECT Thing.A FROM 'var://Test'", data, expected);
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
    return testBase.ExecuteAndAssertDeepEqual("SELECT Thing FROM 'var://Test'", data, expected);
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
    return testBase.ExecuteAndAssertDeepEqual("SELECT Thing.Value[1] FROM 'var://Test'", data, expected);
}


export function SelectStar() {
    var data = [
        { Value: 'A', Child: { Thing: 1 }},
        { Value: 'B', Child: { Blah: 2 } },
        { Value: 'C' , Children: [1,2,3]}
    ];
    
    return testBase.ExecuteAndAssertDeepEqual("SELECT * FROM 'var://Test'", data, data);
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

    return testBase.ExecuteAndAssertDeepEqual("SELECT Child.* FROM 'var://Test'", data, expected);
}

export function SelectTopX() {
    var data = [1, 2, 3, 4, 5, 6, 7, 8].map(n => {
        return {
            Value: n
        };
    });

    var expected = data.slice(0, 3);

    return testBase.ExecuteAndAssertDeepEqual("SELECT TOP 3 Value FROM 'var://Test'", data, expected);
}

export function SelectNumericExpression() {
    var data = [
        { A: 1, B: 2 },
        { A: 3, B: -4 }
    ];
    var query = "SELECT A + B AS C FROM 'var://Test'";
    var expected = [{ C: 3 }, { C: -1 }];

    return testBase.ExecuteAndAssertItems(query, data,
        results => assert.deepEqual(results, expected));
}

export function SelectStringExpression() {
    var data = [
        { Name: 'Bob', HairColour: 'Green' },
        { Name: 'Janet', HairColour: 'Blue' }
    ];
    var query = "SELECT Name + ' has ' + HairColour + ' hair.' AS Sentence FROM 'var://Test'";
    var expected = [{ Sentence: 'Bob has Green hair.' }, { Sentence: 'Janet has Blue hair.' }];

    return testBase.ExecuteAndAssertDeepEqual(query, data,expected);
}

export function SelectWithNumericConstant() {
    var data = [
        { Value: 1 },
        { Value: 2 }
    ];
    var query = "SELECT Value + 1 AS Incremented FROM 'var://Test'";
    var expected = [
        { Incremented: 2 },
        { Incremented: 3 }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function SelectWithSingleAliasedDatasource() {
    var data = [
        { Value: 1 },
        { Value: 2 }
    ];
    var query = "SELECT a.Value AS Value FROM 'var://Test' AS a";


    return testBase.ExecuteAndAssertDeepEqual(query, data, data);
}

export function SelectUsingSquareBracketAccessorOnTableAlias() {
    var data = [
        { "First Name": "Tim", "Favourite food": "Chips" },
        { "First Name": "Dave", "Favourite food": "Batteries" }
    ];
    var expected = [
        { "FirstName": "Tim", "FavouriteFood": "Chips"},
        { "FirstName": "Dave", "FavouriteFood": "Batteries"}
    ]
    var query = "SELECT person['First Name'] AS FirstName, person[\"Favourite food\"] AS FavouriteFood FROM 'var://Test' AS person";


    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function SelectWithSingleQuotedColumnAlias() {
    var data = [
        { "FirstName": "Tim" },
        { "FirstName": "Dave" }
    ]
    var expected = [
        { "First Name": "Tim" },
        { "First Name": "Dave" }
    ];
    
    var query = "SELECT FirstName AS 'First Name' FROM 'var://Test'";


    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function SelectWithDoubleQuotedColumnAlias() {
    var data = [
        { "FirstName": "Tim" },
        { "FirstName": "Dave" }
    ]
    var expected = [
        { "First Name": "Tim" },
        { "First Name": "Dave" }
    ];

    var query = "SELECT FirstName AS \"First Name\" FROM 'var://Test'";


    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}