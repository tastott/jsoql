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
        UseCache?: boolean;
    }

    export interface JsoqlQueryIterator {
        AvailableItems(): number;
        GetNext(count?: number): Q.Promise<any[]>;
        GetAll(): Q.Promise<any[]>;
        Cancel(removeCallbacks?: boolean): void;
        ExecutionTime(): number;
        IsComplete(): boolean;
        OnComplete(handler: () => void): JsoqlQueryIterator;
        OnError(handler: (error: any) => void): JsoqlQueryIterator;
    }

    export interface JsoqlQueryResult {
        GetAll(): Q.Promise<any[]>;

        Iterator: JsoqlQueryIterator;
        Datasources: Datasource[];
        Errors: string[];
    }


    export interface JsoqlQueryHelpResult {
        PropertiesInScope: any;
    }

    export interface JsoqlEngine {
        ExecuteQuery(jsoql: string, context?: JsoqlQueryContext): JsoqlQueryResult;
        GetQueryHelp(jsoql: string, cursorPositionOrIndex: JsoqlPosition|number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
    }

    export class DesktopJsoqlEngine implements JsoqlEngine {
        ExecuteQuery(jsoql: string, context?: JsoqlQueryContext): JsoqlQueryResult;
        GetQueryHelp(jsoql: string, cursorPositionOrIndex: JsoqlPosition|number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
    }

    export class OnlineJsoqlEngine implements JsoqlEngine {
        constructor(appBaseUrl: string, getStoredFile: (id: string) => string);
        ExecuteQuery(jsoql: string, context?: JsoqlQueryContext): JsoqlQueryResult;
        GetQueryHelp(jsoql: string, cursorPositionOrIndex: JsoqlPosition|number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
    }
}