///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import http = require('http');
import assert = require('assert');
import jsoql= require('jsoql')
import Q = require('q')

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

var Jsoql = new jsoql.DesktopJsoqlEngine();

export function ExecuteArrayQuery(jsoql: string, values: any[]| jsoql.JsoqlQueryContext): Q.Promise<any[]> {

    var context: jsoql.JsoqlQueryContext = Object.prototype.toString.call(values) === '[object Array]'
        ? {
            Data: {
                "Test": <any[]>values
            }
        }
        : <jsoql.JsoqlQueryContext>values;

    try {
        return Jsoql.ExecuteQuery(jsoql, context)
            .then(result => {
                if (result.Errors) throw result.Errors;
                else return result.Results;
            });
    }
    catch (ex) {
        return Q.reject<any[]>(ex);
    }
}

export function ExecuteAndAssertResult(query: string,
    values: any[]| jsoql.JsoqlQueryContext,
    assertCallback: (result: jsoql.JsoqlQueryResult) => void): Q.Promise<any> {

    var context: jsoql.JsoqlQueryContext = Object.prototype.toString.call(values) === '[object Array]'
        ? {
            Data: {
                "Test": <any[]>values
            }
        }
        : <jsoql.JsoqlQueryContext>values;

    try {
        return Jsoql.ExecuteQuery(query, context)
            .then(result => setTimeout(() => assertCallback(result)))
            .fail(error => setTimeout(() => assert.fail(null, null, error)));
    }
    catch (ex) {
        setTimeout(() => assert.fail(null, null, ex));
        return Q.reject<any[]>(ex);
    }
}

export function ExecuteAndAssertItems(query: string,
    values: any[]| jsoql.JsoqlQueryContext,
    assertCallback: (results : any[]) => void) : Q.Promise<any> {

    return ExecuteArrayQuery(query, values)
        .then(results => setTimeout(() => assertCallback(results)))
        .fail(error => setTimeout(() => assert.fail(null, null, error)));
}

export function ExecuteAndAssertDeepEqual(query: string,
    values: any[]| jsoql.JsoqlQueryContext,
    expected: any[]): Q.Promise<any> {

    return ExecuteArrayQuery(query, values)
        .then(results => setTimeout(() => assert.deepEqual(results, expected)))
        .fail(error => setTimeout(() => assert.fail(null, null, error)));
}

export function GetHelpAndAssertDeepEqual(query: string,
    cursor: number,
    values: any[]| jsoql.JsoqlQueryContext,
    expected: jsoql.JsoqlQueryHelpResult): Q.Promise<any> {

    var context: jsoql.JsoqlQueryContext = Object.prototype.toString.call(values) === '[object Array]'
        ? {
            Data: {
                "Test": <any[]>values
            }
        }
        : <jsoql.JsoqlQueryContext>values;

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
    values: any[]| jsoql.JsoqlQueryContext): Q.Promise<any>  {

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

export function ExecuteLazyToCompletion(query: string): Q.Promise<jsoql.JsoqlQueryExecution> {
    var deferred = Q.defer<jsoql.JsoqlQueryExecution>();

    try {
        var queryExec = Jsoql.ExecuteQueryLazy(query, null, error => deferred.reject(error));
        queryExec.OnComplete(() => deferred.resolve(queryExec));
    }
    catch (ex) {
        deferred.reject(ex);
    }

    return deferred.promise;

}

export function ExecuteLazyToCompletionAndAssert(query: string, assertCallback : (result : jsoql.JsoqlQueryExecution) => void): Q.Promise<any> {
   
    return ExecuteLazyToCompletion(query)
        .then(result => {
            setTimeout(() => assertCallback(result));
        })
        .fail(err => {
            setTimeout(() => assert.fail(err))
        });

}