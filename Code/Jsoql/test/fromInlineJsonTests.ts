import assert = require('assert');
import testBase = require('./testBase');



describe('FROM inline JSON', () => {
    it('Simple', () => {

        var query = 'SELECT Name FROM [{"Name": "Tim"},{"Name": "Bob"}]';
        var expected = [
            { Name: 'Tim' },
            { Name: 'Bob' }
        ];
        return testBase.ExecuteAndAssertDeepEqual(query, null, expected);
    })

})