import assert = require('assert');
import testBase = require('./testBase');

describe('table functions', () => {
    it('Should apply query to table argument', () => {

        var data = [
            { Value: 1 },
            { Value: 2 },
            { Value: 3 }
        ];
        var query = "WITH (SELECT * FROM @@Table) AS MyTableFunction SELECT *  FROM MyTableFunction('var://Test')";
        
        return testBase.ExecuteAndAssertDeepEqual(query, data, data);
    })
    
    it('Should apply recursively', () => {

        var data = [
            { 
                Value: 1,
                Children: [
                    { Value: 1.1},
                    { 
                        Value: 1.2,
                        Children: [
                            { Value: 1.21}
                        ]
                    }
                ] 
            },
            { Value: 2 },
            { Value: 3 }
        ];
        var query = `WITH (
            SELECT 
                Value + 1 AS Blah, 
                (SELECT * FROM MyTableFunction(Children)) AS SubNodes
            FROM 
                @@Table
            ) AS MyTableFunction 
            SELECT *  FROM MyTableFunction('var://Test')`;
        var expected = [
            {
                Blah: 2,
                SubNodes: [
                    { Blah: 2.1, SubNodes: null},
                    { 
                        Blah: 2.2,
                        SubNodes: [
                            {Blah: 2.21, SubNodes: null}
                        ]
                    }
                ]
            },
            { Blah: 3, SubNodes: null},
            { Blah: 4, SubNodes: null}
        ];
        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })
})