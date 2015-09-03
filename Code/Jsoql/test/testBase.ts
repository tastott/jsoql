import http = require('http');
import assert = require('assert');
import m= require('../models')
import jsoql = require('../jsoql')
import Q = require('q')
import chai = require('chai')
var expect = chai.expect;

var Jsoql = new jsoql.DesktopJsoqlEngine();

export function ExecuteArrayQuery(jsoql: string, values: any[]| m.QueryContext): Q.Promise<any[]> {
   
    var context: m.QueryContext = Object.prototype.toString.call(values) === '[object Array]'
        ? {
            Data: {
                "Test": <any[]>values
            }
        }
        : <m.QueryContext>values;

    try {
        return Jsoql.ExecuteQuery(jsoql, context).GetAll();
    }
    catch (ex) {
        return Q.reject<any[]>(ex);
    }
}

export function ExecuteAndAssertResult(query: string,
    values: any[]| m.QueryContext,
    assertCallback: (results: any[]) => void): Q.Promise<any> {

    var context: m.QueryContext = Object.prototype.toString.call(values) === '[object Array]'
        ? {
            Data: {
                "Test": <any[]>values
            }
        }
        : <m.QueryContext>values;

    try {
        Jsoql.ExecuteQuery(query, context)
            .GetAll()
            .then(results => assertCallback(results))
            .fail(error => assert.fail(null, null, error));
    }
    catch (ex) {
        assert.fail(null, null, ex);
        return Q.reject<any[]>(ex);
    }
}

export function ExecuteAndAssertItems(query: string,
    values: any[]| m.QueryContext,
    assertCallback: (results : any[]) => void) : Q.Promise<any> {

    return ExecuteArrayQuery(query, values)
        .then(results => assertCallback(results))
        .fail(error => assert.fail(null, null, error));
}

export function ExecuteAndAssertDeepEqual(query: string,
    values: any[]| m.QueryContext,
    expected: any[]): Q.Promise<any> {

    return ExecuteArrayQuery(query, values)
        .then(results => {
            assert.deepEqual(results, expected)
        })
        .fail(error => assert.fail(null, null, error));
}

export function GetHelpAndAssertDeepEqual(query: string,
    cursor: number,
    values: any[]| m.QueryContext,
    expected: m.HelpResult): Q.Promise<any> {

    var context: m.QueryContext = Object.prototype.toString.call(values) === '[object Array]'
        ? {
            Data: {
                "Test": <any[]>values
            }
        }
        : <m.QueryContext>values;

    try {
        return Jsoql.GetQueryHelp(query, cursor, context)
            .then(results => assert.deepEqual(results, expected))
            .fail(error => assert.fail(null, null, error));
    }
    catch (ex) {
        return Q.reject<any[]>(ex);
    }
}

export function ExecuteAndAssertFail(query: string,
    values: any[]| m.QueryContext,
    done : MochaDone): void {

    ExecuteArrayQuery(query, values)
        .done(
            results => done(new Error('Expected query to fail')),
            error => done()
        );
}

export function ExecuteAndAssertWithServer(query: string, data : any[], port : number,
    assertCallback: (results: any[]) => void): Q.Promise<any> {

    var server = http.createServer((req, res) => {
        res.write(JSON.stringify(data));
        res.end();
    });

    server.listen(port);

    return ExecuteArrayQuery(query, {})
        .then(results => assertCallback(results))
        .fail(error => assert.fail(null, null, error))
        .finally(() => server.close());
}

export function ExecuteLazyToCompletion(query: string): Q.Promise<m.QueryResult> {
    var deferred = Q.defer<m.QueryResult>();

    try {
        var result = Jsoql.ExecuteQuery(query, null);
        if (result.Errors && result.Errors.length) deferred.reject(result.Errors[0]);
        else {
            result.Iterator
                .OnError(error => deferred.reject(error))
                .OnComplete(() => deferred.resolve(result));
        }
    }
    catch (ex) {
        deferred.reject(ex);
    }

    return deferred.promise;

}

export function ExecuteLazyToCompletionAndAssert(query: string, assertCallback : (result : m.QueryResult) => void): Q.Promise<any> {
   
    return ExecuteLazyToCompletion(query)
        .then(result => {
            assertCallback(result);
        })
        .fail(err => {
            assert.fail(err)
        });

}

export function ExecuteLazy(query: string): m.QueryResult {

    return Jsoql.ExecuteQuery(query, null);
}