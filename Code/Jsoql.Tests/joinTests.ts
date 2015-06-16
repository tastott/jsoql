import jsoql = require('jsoql')
import assert = require('assert');
import testBase = require('./testBase');


export function Join() {
    
    var dataA = [
        { Order: 'A', CustomerId: 1 },
        { Order: 'B', CustomerId: 1 },
        { Order: 'B', CustomerId: 2 }
    ];

    var dataB = [
        { CustomerId: 1, Name: 'Tim' },
        { CustomerId: 2, Name: 'Bob' },
    ];

    var expected = [
        { CustomerId: 1, Name: 'Tim', Order: 'A' },
        { CustomerId: 1, Name: 'Tim', Order: 'B' },
        { CustomerId: 2, Name: 'Bob', Order: 'B' }
    ];

    var data: jsoql.JsoqlQueryContext = {
        Data: {
            "Orders": dataA,
            "Customers": dataB
        }
    };
    var query = "SELECT c.CustomerId AS CustomerId, c.Name AS Name, o.Order AS Order FROM 'var://Orders' AS o JOIN 'var://Customers' AS c ON o.CustomerId = c.CustomerId";
    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function JoinHttpDatasources() {

    var data = [1, 2, 3, 4, 5, 6, 7, 8].map(i => {
        return { Id: i };
    });
    var query = "SELECT a.Id AS A, b.Id AS B FROM 'http://localhost:8000' AS a JOIN 'http://localhost:8000' AS b ON a.Id = b.Id + 1";
    var expected = [1, 2, 3, 4, 5, 6, 7].map(i => {
        return { A: i+1, B: i };
    });

    return testBase.ExecuteAndAssertWithServer(query, data, 8000, results => {
        assert.deepEqual(results, expected);
    });
}