import http = require('http');
import assert = require('assert');
import query = require('../query')
import m = require('../models')
import jsoql = require('../jsoql')
import Q = require('q')

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

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
            .then(results => setTimeout(() => assertCallback(results)))
            .fail(error => setTimeout(() => assert.fail(null, null, error)));
    }
    catch (ex) {
        setTimeout(() => assert.fail(null, null, ex));
        return Q.reject<any[]>(ex);
    }
}

export function ExecuteAndAssertItems(query: string,
    values: any[]| m.QueryContext,
    assertCallback: (results : any[]) => void) : Q.Promise<any> {

    return ExecuteArrayQuery(query, values)
        .then(results => setTimeout(() => assertCallback(results)))
        .fail(error => setTimeout(() => assert.fail(null, null, error)));
}

export function ExecuteAndAssertDeepEqual(query: string,
    values: any[]| m.QueryContext,
    expected: any[]): Q.Promise<any> {

    return ExecuteArrayQuery(query, values)
        .then(results => {
            setTimeout(() => assert.deepEqual(results, expected))
        })
        .fail(error => setTimeout(() => assert.fail(null, null, error)));
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
            .then(results => setTimeout(() => assert.deepEqual(results, expected)))
            .fail(error => setTimeout(() => assert.fail(null, null, error)));
    }
    catch (ex) {
        return Q.reject<any[]>(ex);
    }
}

export function ExecuteAndAssertFail(query: string,
    values: any[]| m.QueryContext): Q.Promise<any>  {

    return ExecuteArrayQuery(query, values)
        .then(results => setTimeout(() => assert.fail(null, null, 'Expected query to fail')));
        //.fail(error => setTimeout(() => assert.fail(error)));


}

export function ExecuteAndAssertWithServer(query: string, data : any[], port : number,
    assertCallback: (results: any[]) => void): Q.Promise<any> {

    var server = http.createServer((req, res) => {
        res.write(JSON.stringify(data));
        res.end();
    });

    server.listen(port);

    return ExecuteArrayQuery(query, {})
        .then(results => setTimeout(() => assertCallback(results)))
        .fail(error => setTimeout(() => assert.fail(null, null, error)))
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
            setTimeout(() => assertCallback(result));
        })
        .fail(err => {
            setTimeout(() => assert.fail(err))
        });

}

export function ExecuteLazy(query: string): m.QueryResult {

    return Jsoql.ExecuteQuery(query, null);
}