///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import http = require('http');
import assert = require('assert');
var Jsoql: JsoqlEngine = new (require('../Jsoql/Scripts/engine')).DesktopJsoqlEngine() //Bit of a workaround to speed development
import Q = require('q')

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function ExecuteArrayQuery(jsoql: string, values: any[]| JsoqlQueryContext): Q.Promise<any[]> {

    var context: JsoqlQueryContext = Object.prototype.toString.call(values) === '[object Array]'
        ? {
            Data: {
                "Test": <any[]>values
            }
        }
        : <JsoqlQueryContext>values;

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

export function ExecuteAndAssert(jsoql: string,
    values: any[]| JsoqlQueryContext,
    assertCallback: (results : any[]) => void) : Q.Promise<any> {

    return ExecuteArrayQuery(jsoql, values)
        .then(results => setTimeout(() => assertCallback(results)))
        .fail(error => setTimeout(() => assert.fail(null, null, error)));
}

export function ExecuteAndAssertDeepEqual(jsoql: string,
    values: any[]| JsoqlQueryContext,
    expected: any[]): Q.Promise<any> {

    return ExecuteArrayQuery(jsoql, values)
        .then(results => setTimeout(() => assert.deepEqual(results, expected)))
        .fail(error => setTimeout(() => assert.fail(null, null, error)));
}

export function GetHelpAndAssertDeepEqual(jsoql: string,
    cursor: number,
    values: any[]| JsoqlQueryContext,
    expected: JsoqlQueryHelpResult): Q.Promise<any> {

    var context: JsoqlQueryContext = Object.prototype.toString.call(values) === '[object Array]'
        ? {
            Data: {
                "Test": <any[]>values
            }
        }
        : <JsoqlQueryContext>values;

    try {
        return Jsoql.GetQueryHelp(jsoql, cursor, context)
            .then(results => setTimeout(() => assert.deepEqual(results, expected)))
            .fail(error => setTimeout(() => assert.fail(null, null, error)));
    }
    catch (ex) {
        return Q.reject<any[]>(ex);
    }
}

export function ExecuteAndAssertFail(jsoql: string,
    values: any[]| JsoqlQueryContext): Q.Promise<any>  {

    return ExecuteArrayQuery(jsoql, values)
        .then(results => setTimeout(() => assert.fail(null, null, 'Expected query to fail')));
        //.fail(error => setTimeout(() => assert.fail(error)));


}

export function ExecuteAndAssertWithServer(jsoql: string, data : any[], port : number,
    assertCallback: (results: any[]) => void): Q.Promise<any> {

    var server = http.createServer((req, res) => {
        res.write(JSON.stringify(data));
        res.end();
    });

    server.listen(port);

    return ExecuteArrayQuery(jsoql, {})
        .then(results => setTimeout(() => assertCallback(results)))
        .fail(error => setTimeout(() => assert.fail(null, null, error)))
        .finally(() => server.close());
}