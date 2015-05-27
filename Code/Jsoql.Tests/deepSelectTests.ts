///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import assert = require('assert');
import testBase = require('./testBase');


export function DeepSelect() {
    var data = [
        { Name: 'Dave', FavouriteFoods: ['Chips', 'Doughnuts'] },
        { Name: 'Jim', FavouriteFoods: ['Baked beans', 'Broccoli'] }
    ];
    var query = "SELECT Name, { FavouritestFood: FavouriteFoods[0], SecondFavouritestFood: FavouriteFoods[1] } AS FoodSummary FROM 'var://Test'";
    var expected = [
        { Name: 'Dave', FoodSummary: { FavouritestFood: 'Chips', SecondFavouritestFood: 'Doughnuts' } },
        { Name: 'Jim', FoodSummary: { FavouritestFood: 'Baked beans', SecondFavouritestFood: 'Broccoli' } }
    ];
    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}
