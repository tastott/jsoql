///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import assert = require('assert');
import testBase = require('./testBase');


function TestHelper(data: any[], queryWithCursor: string, expected: JsoqlQueryHelpResult) {
    //Get position of cursor placeholder and remove it
    var cursor = queryWithCursor.indexOf('@');
    var queryWithoutCursor = queryWithCursor.replace('@', '');

    return testBase.GetHelpAndAssertDeepEqual(queryWithoutCursor, cursor, data, expected);
}

export function HelpWithSelectFlatItems() {
    var data = [
        { Name: 'Dave', FavouriteFood: 'Chips'},
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
}

export function HelpWithSelectFlatItemsAndPartialSelectClause() {
    var data = [
        { Name: 'Dave', FavouriteFood: 'Chips' },
        { Name: 'Jim', FavouriteFood: 'Baked beans' }
    ];
    var query = "SELECT Blah,@ FROM 'var://Test'";
    var expected = {
        PropertiesInScope: {
            Name: true,
            FavouriteFood: true
        }
    };

    return TestHelper(data, query, expected);
}

export function HelpWithSelectFlatItemsAndPartialSelectable() {
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
}

export function HelpWithSelectDeepItems() {
    var data = [
        { Name: 'Dave', Pet: { Name: 'Fluffy', Species: 'Snake' } },
        { Name: 'Jim', Pet: { Name: 'Dave', Species: 'Human' } }
    ];
    var query = "SELECT Pet.@ FROM 'var://Test'"; //This won't be restricted to properties of Pet but it does test that this is parseable
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
}

export function HelpWithSelectArrayProperty() {
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
}

export function HelpWithWhere() {
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
}

export function HelpWithIncompleteWhere() {
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
}
