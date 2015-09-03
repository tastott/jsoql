import assert = require('assert');
import testBase = require('./testBase');

describe('orderByTests', () => {
    it('OrderByAsc', () => {

        var data = [3, 1, 2]
            .map(i => {
                return {
                    Value: i
                }
            });

        var expected = [
            { Value: 1 },
            { Value: 2 },
            { Value: 3 }
        ];
        return testBase.ExecuteAndAssertDeepEqual("SELECT Value FROM 'var://Test' ORDER BY Value ASC", data, expected);
    })

    it('OrderByDesc', () => {

        var data = [3, 1, 2]
            .map(i => {
                return {
                    Value: i
                }
            });

        var expected = [
            { Value: 3 },
            { Value: 2 },
            { Value: 1 }
        ];
        return testBase.ExecuteAndAssertDeepEqual("SELECT Value FROM 'var://Test' ORDER BY Value DESC", data, expected);
    })

    it('OrderByImplicitAsc', () => {

        var data = [3, 1, 2]
            .map(i => {
                return {
                    Value: i
                }
            });

        var expected = [
            { Value: 1 },
            { Value: 2 },
            { Value: 3 }
        ];
        return testBase.ExecuteAndAssertDeepEqual("SELECT Value FROM 'var://Test' ORDER BY Value", data, expected);
    })

    it('OrderByMultiple', () => {

        var data = [
            { Value: 2, Thing: 1 },
            { Value: 1, Thing: 9 },
            { Value: 2, Thing: 3 }
        ];

        var expected = [
            { Value: 1, Thing: 9 },
            { Value: 2, Thing: 1 },
            { Value: 2, Thing: 3 }
        ];
        return testBase.ExecuteAndAssertDeepEqual("SELECT Value, Thing FROM 'var://Test' ORDER BY Value ASC, Thing ASC", data, expected);
    })

    it('OrderByGrouped', () => {

        var data = [
            { Value: 'A' },
            { Value: 'A' },
            { Value: 'A' },
            { Value: 'C' },
            { Value: 'C' },
            { Value: 'B' }
        ];

        var expected = [
            { Value: 'B' },
            { Value: 'C' },
            { Value: 'A' }
        ];
        return testBase.ExecuteAndAssertDeepEqual("SELECT Value FROM 'var://Test' GROUP BY Value ORDER BY COUNT()", data, expected);
    })
})