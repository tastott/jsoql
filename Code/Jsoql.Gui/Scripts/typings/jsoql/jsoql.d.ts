///<reference path="../q/Q.d.ts" />

interface JsoqlQueryContext {
    BaseDirectory?: string;
    Data?: { [key: string]: any[] };
}

interface JsoqlQueryResult {
    Results?: any[];
    Errors?: string[]
}

interface JsoqlEngine {
    ExecuteQuery(jsoql: string, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryResult>;
} 

declare class DesktopJsoqlEngine implements JsoqlEngine {
    ExecuteQuery(jsoql: string, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryResult>;
}
