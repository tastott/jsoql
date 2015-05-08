/// <reference path="Scripts/typings/q/Q.d.ts" />
import Q = require('q');
import m = require('./Scripts/models');
export interface QueryResult {
    Results?: any[];
    Errors?: string[];
}
export declare function ExecuteQuery(jsoql: string, context?: m.QueryContext): Q.Promise<QueryResult>;
