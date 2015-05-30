///<reference path="../q/Q.d.ts" />

interface Datasource {
    Type: string;
    Value: string;
}

interface JsoqlQueryContext {
    BaseDirectory?: string;
    Data?: { [key: string]: any[] };
}

interface JsoqlQueryResult {
    Results?: any[];
    Errors?: string[];
    Datasources?: Datasource[];
}

interface JsoqlQueryHelpResult {
    PropertiesInScope: any;
}

interface JsoqlEngine {
    ExecuteQuery(jsoql: string, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryResult>;
    GetQueryHelp(jsoql: string, cursor: number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
} 

declare class DesktopJsoqlEngine implements JsoqlEngine {
    ExecuteQuery(jsoql: string, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryResult>;
    GetQueryHelp(jsoql: string, cursor: number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
}

declare class OnlineJsoqlEngine implements JsoqlEngine {
    constructor(appBaseUrl : string, getStoredFile: (id :string) => string);
    ExecuteQuery(jsoql: string, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryResult>;
    GetQueryHelp(jsoql: string, cursor: number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
}