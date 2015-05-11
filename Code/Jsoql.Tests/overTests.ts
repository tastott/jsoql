///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import assert = require('assert');
import testBase = require('./testBase');

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function Over() {
    var data = [
        {
            Name: 'Bob',
            Pets: [{ Name: 'Dog' }, { Name: 'Gerbil' }]
        },
        {
            Name: 'Jim',
            Pets: [{ Name: 'Giraffe' }, { Name: 'Ocelot' }, { Name: 'Goldfish' }]
        },
        {
            Name: 'Dave',
            Pets: []
        }
    ];
    var query = "SELECT person.Name AS PersonName, pet.Name AS PetName FROM 'var://Test' AS person OVER person.Pets AS pet";
    var expected = [
        {
            PersonName: 'Bob',
            PetName: 'Dog'
        },
        {
            PersonName: 'Bob',
            PetName: 'Gerbil'
        },
        {
            PersonName: 'Jim',
            PetName: 'Giraffe'
        },
        {
            PersonName: 'Jim',
            PetName: 'Ocelot'
        },
        {
            PersonName: 'Jim',
            PetName: 'Goldfish'
        }
    ];

    return testBase.ExecuteAndAssert(query, data,
        results => assert.deepEqual(results, expected));
}
