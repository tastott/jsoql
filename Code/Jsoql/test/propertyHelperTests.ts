import jsoql = require('../models')
import assert = require('assert');
import testBase = require('./testBase');


function TestHelper(data: any[], queryWithCursor: string, expected: jsoql.HelpResult) {
    //Get position of cursor placeholder and remove it
    var cursor = queryWithCursor.indexOf('@');
    var queryWithoutCursor = queryWithCursor.replace('@', '');

    return testBase.GetHelpAndAssertDeepEqual(queryWithoutCursor, cursor, data, expected);
}


describe('propertyHelperTests', () => {
    it('HelpWithSelectFlatItems', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT @ FROM 'var://Test'";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithSelectFlatItemsAndPartialSelectClause', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT Blah,@\nFROM 'var://Test'";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithSelectFlatItemsAndPartialSelectable', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT Blah,Some@ FROM 'var://Test'";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })


    it('HelpWithSelectDeepItems', () => {

        var data = [
            { Name: 'Dave', Pet: { Name: 'Fluffy', Species: 'Snake' } },
            { Name: 'Jim', Pet: { Name: 'Dave', Species: 'Human' } }
        ];
        var query = "SELECT Pet.@\nFROM 'var://Test'"; //This won't be restricted to properties of Pet but it does test that this is parseable
        var expected = {
            PropertiesInScope: {
                Name: true,
                Pet: {
                    Name: true,
                    Species: true
                }
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithSelectArrayProperty', () => {

        var data = [
            { Name: 'Dave', Pets: [{ Name: 'Fluffy', Species: 'Snake' }] },
            { Name: 'Jim', Pets: [{ Name: 'Dave', Species: 'Human' }] }
        ];
        var query = "SELECT @ FROM 'var://Test'";
        var expected = {
            PropertiesInScope: {
                Name: true,
                Pets: [{
                    Name: true,
                    Species: true
                }]
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithEmptyWhere', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT * FROM 'var://Test' WHERE @";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithIncompleteWhereExpression', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT * FROM 'var://Test' WHERE Name =@";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithIncompleteWhereProperty', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT * FROM 'var://Test' WHERE Name = Blah.@";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithEmptyOrderBy', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT * FROM 'var://Test' ORDER BY @";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithPartialOrderBy', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT * FROM 'var://Test' ORDER BY Name,@";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithPartialOrderByProperty', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT * FROM 'var://Test' ORDER BY Name.@";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithGroupedSelect', () => {

        var data = [
            { Name: 'Dave', Pets: [{ Name: 'Fluffy', Species: 'Snake' }] },
            { Name: 'Jim', Pets: [{ Name: 'Dave', Species: 'Human' }] }
        ];
        var query = "SELECT @ FROM 'var://Test' GROUP BY Name, Pets[0].Species";
        var expected = {
            PropertiesInScope: {
                Name: true, //Only grouped properties are suggested
                "Pets[0].Species": true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithWhereGroup', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT Name FROM 'var://Test' WHERE @ GROUP BY Name";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithGroupedOrderBy', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT Name FROM 'var://Test' GROUP BY Name ORDER BY @";
        var expected = {
            PropertiesInScope: {
                Name: true //Only grouped properties are suggested
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithJoinedSelect', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT @ FROM 'var://Test' AS a JOIN 'var://Test' AS b ON a.Name = b.Name";
        var expected = {
            PropertiesInScope: {
                a: {
                    Name: true,
                    FavouriteFood: true
                },
                b: {
                    Name: true,
                    FavouriteFood: true
                }
            }
        };

        return TestHelper(data, query, expected);
    })


    it('HelpWithEmptyOn', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT * FROM 'var://Test' AS a JOIN 'var://Test' AS b ON @";
        var expected = {
            PropertiesInScope: {
                a: {
                    Name: true,
                    FavouriteFood: true
                },
                b: {
                    Name: true,
                    FavouriteFood: true
                }
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithIncompleteOn', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT * FROM 'var://Test' AS a JOIN 'var://Test' AS b ON a.Name = @";
        var expected = {
            PropertiesInScope: {
                a: {
                    Name: true,
                    FavouriteFood: true
                },
                b: {
                    Name: true,
                    FavouriteFood: true
                }
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithIncompleteOnProperty', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT * FROM 'var://Test' AS a JOIN 'var://Test' AS b ON a.Name = b.@";
        var expected = {
            PropertiesInScope: {
                a: {
                    Name: true,
                    FavouriteFood: true
                },
                b: {
                    Name: true,
                    FavouriteFood: true
                }
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithEmptyGroupBy', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT Name FROM 'var://Test' GROUP BY @";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })


    it('HelpWithIncompleteGroupBy', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT Name FROM 'var://Test' GROUP BY Name,@";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithIncompleteGroupByProperty', () => {

        var data = [
            { Name: 'Dave', FavouriteFood: 'Chips' },
            { Name: 'Jim', FavouriteFood: 'Baked beans' }
        ];
        var query = "SELECT Name FROM 'var://Test' GROUP BY Name,x.@";
        var expected = {
            PropertiesInScope: {
                Name: true,
                FavouriteFood: true
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithEmptyOver', () => {

        var data = [
            { Name: 'Dave', Pets: [{ Name: 'Fluffy', Species: 'Snake' }] },
            { Name: 'Jim', Pets: [{ Name: 'Dave', Species: 'Human' }] }
        ];

        var query = "SELECT Name FROM 'var://Test' AS person OVER @";
        var expected = {
            PropertiesInScope: {
                person: {
                    Name: true,
                    Pets: [{
                        Name: true,
                        Species: true
                    }]
                }
            }
        };

        return TestHelper(data, query, expected);
    })

    it('HelpWithIncompleteOver', () => {

        var data = [
            { Name: 'Dave', Pets: [{ Name: 'Fluffy', Species: 'Snake' }] },
            { Name: 'Jim', Pets: [{ Name: 'Dave', Species: 'Human' }] }
        ];

        var query = "SELECT Name FROM 'var://Test' AS person OVER person.@";
        var expected = {
            PropertiesInScope: {
                person: {
                    Name: true,
                    Pets: [{
                        Name: true,
                        Species: true
                    }]
                }
            }
        };

        return TestHelper(data, query, expected);
    })
})