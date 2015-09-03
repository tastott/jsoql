///<reference path="../typings/mocha/mocha.d.ts" /> 
import assert = require('assert');
import testBase = require('./testBase');


describe('commentTests', () => {
    it('QueryWithComment', () => {

        var data = [
            { Name: 'Banana', Colour: 'Yellow' },
            { Name: 'Apple', Colour: 'Green' }
        ];

        var query = "SELECT * -- This should be ignored\nFROM 'var://Test'";

        return testBase.ExecuteAndAssertDeepEqual(query, data, data);
    })

})