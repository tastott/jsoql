import testBase = require('./testBase')
import assert = require('assert');
import fs = require('fs')
import Q = require('q')
import path = require('path')

function readDataFile(filename: string, encoding: string) : Q.Promise<string> {
    return Q.nfcall<string>(fs.readFile, path.join(__dirname, 'Data', filename), encoding);
}

describe('fromUrlTests', function(){
    //this.timeout(5000);
    it('FromUrl', () => {


        var jsoql = "SELECT * FROM 'http://localhost:8000/whatever.json'";

        return readDataFile('orders.json', 'utf8')
            .then(json => JSON.parse(json))
            .then(data => testBase.ExecuteAndAssertWithServer(jsoql, data, 8000, results => assert.deepEqual(results, data)))
            .fail(error => setTimeout(() => assert.fail(null, null, error)));
    })

    it('FromUrlWithExplicitRoot', () => {


        var jsoql = "SELECT * FROM {uri: 'http://localhost:8000/whatever.json', root: 'SomeProperty'}";

        return readDataFile('nested-orders.json', 'utf8')
            .then(json => JSON.parse(json))
            .then(data => testBase.ExecuteAndAssertWithServer(jsoql, data, 8000, results => assert.deepEqual(results, data.SomeProperty)))
            .fail(error => setTimeout(() => assert.fail(null, null, error)));
    })

    it('FromUrlWithObjectRoot', () => {


        var jsoql = "SELECT * FROM 'http://localhost:8000/whatever.json'";

        return readDataFile('nested-orders.json', 'utf8')
            .then(json => JSON.parse(json))
            .then(data => testBase.ExecuteAndAssertWithServer(jsoql, data, 8000, results => assert.deepEqual(results, [data])))
            .fail(error => setTimeout(() => assert.fail(null, null, error)));
    })

    it('ErrorReturnedForNonExistentDomain', done => {

        var query = "SELECT * FROM 'http://669b40f7-41a4-4aa9-90fb-dab6b0c1844f.com/some.json'";
        testBase.ExecuteAndAssertFail(query, null, done);
    })

    it('ErrorReturnedFor404', done => {

        var query = "SELECT * FROM 'http://www.google.com/669b40f7-41a4-4aa9-90fb-dab6b0c1844f.json'";
        testBase.ExecuteAndAssertFail(query, null, done);
    })
})