import assert = require('assert');
import testBase = require('./testBase');

describe('Select sub-query tests', function() {
    this.timeout(5000);

     describe('Unaggregated', () => {
         
         it('Unaggregated sub-query', () => {
            var data = [
                {
                    Name: 'Bob',
                    Pets: [{ Name: 'Dog', Legs: 4 }, { Name: 'Chicken', Legs: 2 }]
                },
                {
                    Name: 'Dave',
                    Pets: []
                }
            ];
            
            var query = "SELECT Name, (SELECT Name, Name + ' with ' + Legs + ' legs' AS Description FROM Pets) AS Pets FROM 'var://Test'";
            
            var expected = [
                 {
                    Name: 'Bob',
                    Pets: [
                        { Name: 'Dog', Description: 'Dog with 4 legs' }, 
                        { Name: 'Chicken', Description: 'Chicken with 2 legs' }
                    ]
                },
                {
                    Name: 'Dave',
                    Pets: []
                }
            ]
            
            
            return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
         })
           
     })

    describe('Aggregated', () => {
        
        it('SelectSubQueryWithCountOfPrimitives', () => {

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

            return testBase.ExecuteAndAssertItems(query, data,
                results => assert.deepEqual(results, expected));
        })

        it('SelectSubQueryWithNonUniversalProperty', () => {

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

            return testBase.ExecuteAndAssertItems(query, data,
                results => assert.deepEqual(results, expected));
        })

        //it('SelectSubQueryWithQuotedFromCausesException', () => {

        //    var data = [
        //        {
        //            Name: 'Bob',
        //            Pets: ['Dog', 'Gerbil']
        //        },
        //        {
        //            Name: 'Jim',
        //            Pets: ['Giraffe', 'Ocelot', 'Goldfish']
        //        },
        //        {
        //            Name: 'Dave',
        //            Pets: []
        //        }
        //    ];
        //    var query = "SELECT Name, (SELECT COUNT() FROM 'var://Test') AS NumberOfSomethingElse FROM 'var://Test'";

        //    assert.throws(() => testBase.ExecuteArrayQuery(query, data));
        //}

        it('SelectSubQueryWithMoreThanOneColumnReturnsObject', () => {
            var data = [
                {
                    Name: 'Bob',
                    Pets: [{ Name: 'Dog', Legs: 4 }, { Name: 'Gerbil', Legs: 4 }]
                },
                {
                    Name: 'Jim',
                    Pets: [{ Name: 'Giraffe', Legs: 4 }, { Name: 'Ocelot', Legs: 4 }, { Name: 'Goldfish', Legs: 0 }]
                },
                {
                    Name: 'Dave',
                    Pets: []
                }
            ];
            var query = "SELECT Name, (SELECT COUNT() AS Count, FIRST(Name) AS FirstPet FROM Pets) AS PetSummary FROM 'var://Test'";

            var expected = [
                {
                    Name: 'Bob',
                    PetSummary: {
                        Count: 2,
                        FirstPet: 'Dog'
                    }
                },
                {
                    Name: 'Jim',
                    PetSummary: {
                        Count: 3,
                        FirstPet: 'Giraffe'
                    }
                },
                {
                    Name: 'Dave',
                    PetSummary: {
                        Count: 0,
                        FirstPet: null
                    }
                }
            ]

            return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
        })

        it('SelectSubQueryWithCountOfObjects', () => {

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

            return testBase.ExecuteAndAssertItems(query, data,
                results => assert.deepEqual(results, expected));
        })

        it('SelectSubQueryWithSumOfObjectProperty', () => {

            var data = [
                {
                    Name: 'Bob',
                    Pets: [{ Type: 'Dog', Legs: 4 }, { Type: 'Gerbil', Legs: 4 }]
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

            return testBase.ExecuteAndAssertItems(query, data,
                results => assert.deepEqual(results, expected));
        })

        it('SelectSubQueryWithNestedPropertyAsFrom', () => {

            var data = [
                {
                    Name: 'Bob',
                    Pets: [
                        { Name: 'Dog', Eats: ['Bones', 'Cats', 'Chips'] },
                        { Name: 'Chicken', Eats: ['Corn'] }
                    ]
                },
                {
                    Name: 'Jim',
                    Pets: [
                        { Name: 'Giraffe', Eats: ['Leaves', 'Burgers'] },
                        { Name: 'Ocelot', Eats: ['Small mammals'] },
                        { Name: 'Goldfish', Eats: ['Fish food', 'Each other'] }
                    ]
                }
            ];
            var query = "SELECT Name, (SELECT COUNT() FROM Pets[0].Eats) AS FirstPetFoods FROM 'var://Test'";
            var expected = [
                {
                    Name: 'Bob',
                    FirstPetFoods: 3
                },
                {
                    Name: 'Jim',
                    FirstPetFoods: 2
                }
            ];

            return testBase.ExecuteAndAssertItems(query, data,
                results => assert.deepEqual(results, expected));
        })
    })
})