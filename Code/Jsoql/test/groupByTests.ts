import assert = require('assert');
import testBase = require('./testBase');

describe('groupByTests', () => {
    it('Count', () => {

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
    })

    it('Sum', () => {

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
    })

    it('Avg', () => {

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
    })
    
    it('First', () => {

        var data = [
            { Value: 1 },
            { Value: 2 },
            { Value: 3 }
        ];
        var expected = [{ FIRST: 1 }];
        return testBase.ExecuteAndAssertDeepEqual("SELECT FIRST(Value) FROM 'var://Test'", data, expected);
    })
    
    it('$', () => {

        var data = [
            1,
            2,
            3
        ];
        var expected = [{ MAX: 3 }];
        return testBase.ExecuteAndAssertDeepEqual("SELECT MAX($) FROM 'var://Test'", data, expected);
    })

    it('GroupBy', () => {

        var data = [
            { Value: 1, Thing: true },
            { Value: 2, Thing: true },
            { Value: 3, Thing: false }
        ];
        var expected = [
            { Thing: true },
            { Thing: false }
        ];
        return testBase.ExecuteAndAssertDeepEqual("SELECT Thing FROM 'var://Test' GROUP BY Thing", data, expected);
    })

    it('GroupByWithAggregate', () => {

        var data = [
            { Value: 1, Thing: true },
            { Value: 2, Thing: true },
            { Value: 3, Thing: false }
        ];
        var expected = [
            { Thing: true, Count: 2 },
            { Thing: false, Count: 1 }
        ];
        return testBase.ExecuteAndAssertDeepEqual("SELECT Thing, COUNT() AS Count FROM 'var://Test' GROUP BY Thing", data, expected);
    })

    it('WhereGroupBy', () => {

        var data = [
            { Value: '1', Thing: true },
            { Value: '2', Thing: true },
            { Value: '3', Thing: false }
        ];
        var expected = [
            { Thing: true }
        ];
        return testBase.ExecuteAndAssertDeepEqual("SELECT Thing FROM 'var://Test' WHERE Value != '3' GROUP BY Thing", data, expected);
    })

    it('GroupByHaving', () => {

        var data = [
            { Name: 'Bob', Message: 'Hello, my name is Bob' },
            { Name: 'Dave', Message: 'Hi Bob, nice to meet you' },
            { Name: 'Bob', Message: "Well this is nice isn't it?" }
        ];
        var query = "SELECT Name FROM 'var://Test' GROUP BY Name HAVING COUNT() > 1";

        var expected = [
            { Name: 'Bob' }
        ];
        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })

    it('GroupByWithScalarFunction', () => {

        var data = [
            { Name: 'Bob', Message: 'Hello, my name is Bob' },
            { Name: 'Dave', Message: 'Hi Bob, nice to meet you' },
            { Name: 'Bob', Message: "Well this is nice isn't it?" }
        ];
        var query = "SELECT REGEXMATCH(Name, '^[A-Z]') AS FirstLetter FROM 'var://Test' GROUP BY Name";

        var expected = [
            { FirstLetter: 'B' },
            { FirstLetter: 'D' }
        ];
        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })

    it('GroupByWithArithmetic', () => {

        var data = [
            { Name: 'Bob', Message: 'Hello, my name is Bob' },
            { Name: 'Dave', Message: 'Hi Bob, nice to meet you' },
            { Name: 'Bob', Message: "Well this is nice isn't it?" }
        ];
        var query = "SELECT Name, COUNT() / 3 AS Proportion FROM 'var://Test' GROUP BY Name";

        var expected = [
            { Name: 'Bob', Proportion: 2 / 3 },
            { Name: 'Dave', Proportion: 1 / 3 }
        ];
        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })

    it('GroupByStringExpression', () => {

        var data = [
            { FirstName: 'Bob', LastName: 'Hoskins', Message: 'Hello, my name is Bob' },
            { FirstName: 'Dave', LastName: 'Hasselhoff', Message: 'Hi Bob, nice to meet you' },
            { FirstName: 'Bob', LastName: 'Hoskins', Message: "Well this is nice isn't it?" }
        ];
        var query = "SELECT FirstName + ' ' + LastName AS Name FROM 'var://Test' GROUP BY FirstName + ' ' + LastName";

        var expected = [
            { Name: 'Bob Hoskins' },
            { Name: 'Dave Hasselhoff' }
        ];
        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })

    it('GroupByNumericExpression', () => {

        var data = [
            { PersonId: 1, Message: 'Hello, my name is Bob' },
            { PersonId: 2, Message: 'Hi Bob, nice to meet you' },
            { PersonId: 1, Message: "Well this is nice isn't it?" }
        ];
        var query = "SELECT PersonId + 1 AS IdPlusOne FROM 'var://Test' GROUP BY PersonId + 1";

        var expected = [
            { IdPlusOne: 2 },
            { IdPlusOne: 3 }
        ];
        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })


    it('GroupByFunction', () => {

        var data = [
            { FirstName: 'Bob', LastName: 'Hoskins', Message: 'Hello, my name is Bob' },
            { FirstName: 'Dave', LastName: 'Hasselhoff', Message: 'Hi Bob, nice to meet you' },
            { FirstName: 'Bob', LastName: 'Hoskins', Message: "Well this is nice isn't it?" }
        ];
        var query = "SELECT REGEXMATCH(FirstName, '^[A-Z]') AS FirstLetter FROM 'var://Test' GROUP BY REGEXMATCH(FirstName, '^[A-Z]')";

        var expected = [
            { FirstLetter: 'B' },
            { FirstLetter: 'D' }
        ];
        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })
    
     it('GroupByItems', () => {

        var data = [
            { FirstName: 'Herbert', LastName: 'Hoskins'},
            { FirstName: 'David', LastName: 'Davies'},
            { FirstName: 'David', LastName: 'Dickens'}
        ];
        var query = "SELECT FirstName, ITEMS() AS Items FROM 'var://Test' GROUP BY FirstName";

        var expected = [
            {
                 FirstName:  'Herbert',
                 Items:[
                        {FirstName: 'Herbert', LastName: 'Hoskins'},
                 ]
            },
            {
                 FirstName:  'David',
                 Items:[
                        { FirstName: 'David', LastName: 'Davies'},
                        { FirstName: 'David', LastName: 'Dickens'}
                 ]
            }
        ];
        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })
})