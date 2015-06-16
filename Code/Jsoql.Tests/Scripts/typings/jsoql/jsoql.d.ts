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
        Cancel(removeCallbacks?: boolean): void;
        GetNext(count: number): Q.Promise<any[]>;
        AvailableItems(): number;
        ExecutionTime(): number;
        IsComplete(): boolean;
        OnComplete(handler: () => void): JsoqlQueryResult;
        OnError(handler: (error: any) => void): JsoqlQueryResult;
        Datasources?: Datasource[];
        GetAll(): Q.Promise<any[]>;
    }


    export interface JsoqlQueryHelpResult {
        PropertiesInScope: any;
    }

    export interface JsoqlEngine {
        ExecuteQuery(jsoql: string, context?: JsoqlQueryContext, onError? : (error : any) => void): JsoqlQueryResult;
        GetQueryHelp(jsoql: string, cursorPositionOrIndex: JsoqlPosition|number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
    }

    export class DesktopJsoqlEngine implements JsoqlEngine {
        ExecuteQuery(jsoql: string, context?: JsoqlQueryContext, onError?: (error: any) => void): JsoqlQueryResult;
        GetQueryHelp(jsoql: string, cursorPositionOrIndex: JsoqlPosition|number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
    }

    export class OnlineJsoqlEngine implements JsoqlEngine {
        constructor(appBaseUrl: string, getStoredFile: (id: string) => string);
        ExecuteQuery(jsoql: string, context?: JsoqlQueryContext, onError?: (error: any) => void): JsoqlQueryResult;
        GetQueryHelp(jsoql: string, cursorPositionOrIndex: JsoqlPosition|number, context?: JsoqlQueryContext): Q.Promise<JsoqlQueryHelpResult>
    }
}