///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import assert = require('assert');
import testBase = require('./testBase');

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545


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

    var data: JsoqlQueryContext = {
        Data: {
            "Orders": dataA,
            "Customers": dataB
        }
    };

    return testBase.ExecuteArrayQuery("SELECT c.CustomerId AS CustomerId, c.Name AS Name, o.Order AS Order FROM 'var://Orders' AS o JOIN 'var://Customers' AS c ON o.CustomerId = c.CustomerId", data)
        .then(results => {
        setTimeout(() => assert.deepEqual(results, expected));
    });
}