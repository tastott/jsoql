import assert = require('assert');
import testBase = require('./testBase');

describe('Promote', () => {
	it('Should promote column to be row value', () => {
		var data = [
			{ Name: 'Bob'},
			{ Name: 'Dave'},
			{ Name: 'Jim' }
		];
		
		var query = "SELECT PROMOTE Name FROM 'var://Test'";
		
		var expected = ['Bob', 'Dave', 'Jim'];
		
		return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
	})
	
	it('Should promote column in aggregated query', () => {
		var data = [
			{ Name: 'Bob'},
			{ Name: 'Dave'},
			{ Name: 'Jim' }
		];
		
		var query = "SELECT PROMOTE FIRST(Name) FROM 'var://Test'";
		
		var expected = ['Bob'];
		
		return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
	})
	
	it('Should complain if more than one column is promoted', done => {
		var data = [
			{ Name: 'Bob', FavouriteFood: 'Toast'},
			{ Name: 'Dave', FavouriteFood: 'Sausage'},
			{ Name: 'Jim', FavouriteFood: 'Beans' }
		];
		
		var query = "SELECT PROMOTE Name, FavouriteFood FROM 'var://Test'";
		
		return testBase.ExecuteAndAssertFail(query, data, done);
	})
	
	it('Should complain if * is promoted', done => {
		var data = [
			{ Name: 'Bob'},
			{ Name: 'Dave'},
			{ Name: 'Jim' }
		];
		
		var query = "SELECT PROMOTE * FROM 'var://Test'";
		
		return testBase.ExecuteAndAssertFail(query, data, done);
	})
	
	it('Should promote column in sub-query', () => {
		var data = [
			{
				FamilyName: 'Smith',
				Members: [
					{ Name: 'Bob', FavouriteFood: 'Toast'},
					{ Name: 'Dave', FavouriteFood: 'Sausage'},
					{ Name: 'Jim', FavouriteFood: 'Beans' }
				]
			},
			{
				FamilyName: 'Jones',
				Members: [
					{ Name: 'Arnold', FavouriteFood: 'Egg'},
					{ Name: 'Barry', FavouriteFood: 'Tomato sauce'},
				]
			}
		];
		
		var query = "SELECT FamilyName, (SELECT PROMOTE Name FROM Members) AS Members FROM 'var://Test'";
		var expected = [
			{ FamilyName: 'Smith', Members: ['Bob','Dave', 'Jim']},
			{ FamilyName: 'Jones', Members: ['Arnold', 'Barry']}
		];
		
		return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
	})
})