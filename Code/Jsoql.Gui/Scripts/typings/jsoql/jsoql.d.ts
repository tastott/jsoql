///<reference path="../q/Q.d.ts" />


interface JsoqlQueryResult {
    Results?: any[];
    Errors?: string[]
} 

interface JsoqlStatic {
    ExecuteQuery(jsoql: string): Q.Promise<QueryResult>;
} 


