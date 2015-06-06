///<reference path="../q/Q.d.ts" />

declare module 'jsoql' {
    export interface JsoqlPosition {
        Column: number;
        Line: number;
    }

    export interface Datasource {
        Type: string;
        Value: string;
    }

    export interface JsoqlQueryContext {
        BaseDirectory?: string;
        Data?: { [key: string]: any[] };
    }

    interface JsoqlQueryResult {
        Results?: any[];
        Errors?: string[];
        Datasources?: Datasource[];
    }

    export interface JsoqlQueryHelpResult {
        PropertiesInScope: any;
    }

    export interface JsoqlEngine {
        ExecuteQuery(jsoql: string, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryResult>;
        GetQueryHelp(jsoql: string, cursorPositionOrIndex: JsoqlPosition|number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
    }

    export class DesktopJsoqlEngine implements JsoqlEngine {
        ExecuteQuery(jsoql: string, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryResult>;
        GetQueryHelp(jsoql: string, cursorPositionOrIndex: JsoqlPosition|number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
    }

    export class OnlineJsoqlEngine implements JsoqlEngine {
        constructor(appBaseUrl: string, getStoredFile: (id: string) => string);
        ExecuteQuery(jsoql: string, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryResult>;
        GetQueryHelp(jsoql: string, cursorPositionOrIndex: JsoqlPosition|number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
    }
}