///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import assert = require('assert');
import testBase = require('./testBase');

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function SelectSubQueryWithCountOfPrimitives() {
    var data = [
        {
            Name: 'Bob',
            Pets: ['Dog', 'Gerbil']
        },
        {
            Name: 'Jim',
            Pets: ['Giraffe', 'Ocelot', 'Goldfish']
        },
        {
            Name: 'Dave',
            Pets: []
        }
    ];
    var query = "SELECT Name, (SELECT COUNT() FROM Pets) AS NumberOfPets FROM 'var://Test'";
    var expected = [
        {
            Name: 'Bob',
            NumberOfPets: 2
        },
        {
            Name: 'Jim',
            NumberOfPets: 3
        },
        {
            Name: 'Dave',
            NumberOfPets: 0
        }
    ];

    return testBase.ExecuteAndAssert(query, data,
        results => assert.deepEqual(results, expected));
}

export function SelectSubQueryWithNonUniversalProperty() {
    var data = [
        {
            Name: 'Bob',
            Pets: ['Dog', 'Gerbil']
        },
        {
            Name: 'Jim',
            Pets: ['Giraffe', 'Ocelot', 'Goldfish']
        },
        {
            Name: 'Dave'
        }
    ];
    var query = "SELECT Name, (SELECT COUNT() FROM Pets) AS NumberOfPets FROM 'var://Test'";
    var expected = [
        {
            Name: 'Bob',
            NumberOfPets: 2
        },
        {
            Name: 'Jim',
            NumberOfPets: 3
        },
        {
            Name: 'Dave',
            NumberOfPets: null
        }
    ];

    return testBase.ExecuteAndAssert(query, data,
        results => assert.deepEqual(results, expected));
}

export function SelectSubQueryWithQuotedFromCausesException() {
    var data = [
        {
            Name: 'Bob',
            Pets: ['Dog', 'Gerbil']
        },
        {
            Name: 'Jim',
            Pets: ['Giraffe', 'Ocelot', 'Goldfish']
        },
        {
            Name: 'Dave',
            Pets: []
        }
    ];
    var query = "SELECT Name, (SELECT COUNT() FROM 'var://Test') AS NumberOfSomethingElse FROM 'var://Test'";

    assert.throws(() => testBase.ExecuteArrayQuery(query, data));
}

export function SelectSubQueryWithMoreThanOneFieldCausesException() {
    var data = [
        {
            Name: 'Bob',
            Pets: ['Dog', 'Gerbil']
        },
        {
            Name: 'Jim',
            Pets: ['Giraffe', 'Ocelot', 'Goldfish']
        },
        {
            Name: 'Dave',
            Pets: []
        }
    ];
    var query = "SELECT Name, (SELECT COUNT(), SomethingElse FROM Pets) AS NumberOfPets FROM 'var://Test'";

    assert.throws(() => testBase.ExecuteArrayQuery(query, data));
}

export function SelectSubQueryWithCountOfObjects() {
    var data = [
        {
            Name: 'Bob',
            Pets: [{ Type: 'Dog' }, { Type: 'Gerbil' }]
        },
        {
            Name: 'Jim',
            Pets: [{ Type: 'Giraffe' }, { Type: 'Ocelot' }, { Type: 'Goldfish' }]
        },
        {
            Name: 'Dave',
            Pets: []
        }
    ];
    var query = "SELECT Name, (SELECT COUNT() FROM Pets) AS NumberOfPets FROM 'var://Test'";
    var expected = [
        {
            Name: 'Bob',
            NumberOfPets: 2
        },
        {
            Name: 'Jim',
            NumberOfPets: 3
        },
        {
            Name: 'Dave',
            NumberOfPets: 0
        }
    ];

    return testBase.ExecuteAndAssert(query, data,
        results => assert.deepEqual(results, expected));
}

export function SelectSubQueryWithSumOfObjectProperty() {
    var data = [
        {
            Name: 'Bob',
            Pets: [{ Type: 'Dog' , Legs: 4}, { Type: 'Gerbil', Legs: 4 }]
        },
        {
            Name: 'Jim',
            Pets: [{ Type: 'Giraffe', Legs: 4 }, { Type: 'Parrot', Legs: 2 }, { Type: 'Goldfish', Legs: 0 }]
        },
        {
            Name: 'Dave',
            Pets: []
        }
    ];
    var query = "SELECT Name, (SELECT SUM(Legs) FROM Pets) AS NumberOfLegs FROM 'var://Test'";
    var expected = [
        {
            Name: 'Bob',
            NumberOfLegs: 8
        },
        {
            Name: 'Jim',
            NumberOfLegs: 6
        },
        {
            Name: 'Dave',
            NumberOfLegs: 0
        }
    ];

    return testBase.ExecuteAndAssert(query, data,
        results => assert.deepEqual(results, expected));
}
