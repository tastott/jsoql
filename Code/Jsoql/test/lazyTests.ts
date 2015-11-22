///<reference path="../typings/mocha/mocha.d.ts" /> 
var lazy: LazyJS.LazyStatic = require('../Hacks/lazy.node')
import chai = require('chai')
import Q = require('q')

var expect = chai.expect;

describe('Map Async sequence', () => {
	it('Should work with synchronous items', () => {
		var data = [1,2,3];
		var sequence = lazy(data).mapAsync(x => x);
		
		return (<any>sequence.toArray())
			.then(results => {
				expect(results).to.be.deep.equal(data);
			})
	})
	
	it('Should work with asynchronous items', () => {
		var data = [1,2,3];
		var sequence = lazy(data).mapAsync(x => Q.delay(x, 100));
		
		return (<any>sequence.toArray())
			.then(results => {
				expect(results).to.be.deep.equal(data);
			})
	})
	
	it('Should work with mixture of synchronous and asynchronous items', () => {
		var data = [1,2,3,4];
		var sequence = lazy(data).mapAsync(x => x % 2 ? Q.delay(x, 100) : x);
		
		return (<any>sequence.toArray())
			.then(results => {
				expect(results).to.be.deep.equal(data);
			})
	})
})