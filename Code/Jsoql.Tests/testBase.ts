﻿///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import assert = require('assert');
var Jsoql: JsoqlStatic = require('../Jsoql/jsoql') //Bit of a workaround to speed development
import Q = require('q')


export function ExecuteArrayQuery(jsoql: string, values: any[]| JsoqlQueryContext): Q.Promise<any[]> {

    var context: JsoqlQueryContext = Object.prototype.toString.call(values) === '[object Array]'
        ? {
            Data: {
                "Test": <any[]>values
            }
        }
        : <JsoqlQueryContext>values;

    return Jsoql.ExecuteQuery(jsoql, context)
        .then(result => result.Results);
}