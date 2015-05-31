import assert = require('assert');
import testBase = require('./testBase')

export function ExpressionCanIncludeEmptyStringLiteral() {
    var data = [
        { Name: 'Bob' },
        { Name: '' }
    ];
    var query = "SELECT Name FROM 'var://Test' WHERE Name = ''";
    var expected = data.slice(-1);
    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}