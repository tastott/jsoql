import assert = require('assert');
import qry = require('../query')
import parse = require('../parse')
import lazy = require('lazy.js')
import Q = require('q')
import tutil = require('./testUtilities')

describe("Query",() => {

    it("Test", () => {
        var data = [
            { Name: 'a' },
            { Name: 'b' },
            { Name: 'c' }
        ];
        var expected = [{ Count: 3 }];
        assert.ok(false, "Tests don't work!");
    });


});


