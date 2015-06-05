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

export function DeepSelectWithArray() {
    var data = [
        { Name: 'Dave', FavouriteFood1: 'Chips', FavouriteFood2: 'Doughnuts' },
        { Name: 'Jim', FavouriteFood1: 'Baked beans', FavouriteFood2:'Broccoli'}
    ];
    var query = "SELECT Name, { FavouriteFoods: [FavouriteFood1, FavouriteFood2] } AS FoodSummary FROM 'var://Test'";
    var expected = [
        { Name: 'Dave', FoodSummary: { FavouriteFoods: ['Chips', 'Doughnuts'] } },
        { Name: 'Jim', FoodSummary: { FavouriteFoods: ['Baked beans', 'Broccoli']} }
    ];
    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}
