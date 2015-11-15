export interface QueryContext {
    BaseDirectory?: string;
    Data?: { [key: string]: any[] };
    UseCache?: boolean;
}

export interface Group {
    Key: any;
    Items: any[];
}

export interface Datasource {
    Type: string;
    Value: any;
}

export interface QueryIterator {
    AvailableItems(): number;
    GetNext(count?: number): Q.Promise<any[]>;
    GetAll(): Q.Promise<any[]>;
    Cancel(removeCallbacks?: boolean): void;
    ExecutionTime(): number;
    IsComplete(): boolean;
    OnComplete(handler: () => void): QueryIterator;
    OnError(handler: (error: any) => void): QueryIterator;
}

export interface QueryResult {
    Iterator?: QueryIterator;
    Datasources: Datasource[];
    Errors: string[];
    
    GetAll(): Q.Promise<any[]>;
}


export interface HelpResult {
    PropertiesInScope: any;
}


export interface Position {
    Column: number;
    Line: number;
}

export interface Range {
    From: Position;
    To: Position;
}

export interface ErrorHandler {
    (error: any): void;
}


export interface Selectable {
    Expression: any;
    Alias?: string;
}

export interface KeyValue {
    Key: string;
    Value: any;
}

export interface FromClauseNode {
    Join?: {
        Type: string;
        Left: FromClauseNode;
        Right: FromClauseNode;
        Condition: any;
    };
    Over?: {
        Left: FromClauseNode;
        Right: any;
        Alias: string;
    };
    Target?: any;
    Alias?: string;
    KeyValues?: KeyValue[];
    SubQuery: Statement;
}

export interface GroupByClause {
    Groupings: any[];
    Having: any
}

export interface JisonRange {
    first_line: number;
    last_line: number;
    first_column: number;
    last_column: number;
}

export interface Positions {
    Select: Range;
    From: Range;
    Where: Range;
    GroupBy: Range;
    OrderBy: Range;
}

export interface Statement {
    Select: {
        SelectList: Selectable[];
        Limit: number;
        Promote?: boolean;
    }
    From: FromClauseNode;
    Where?: any;
    GroupBy?: GroupByClause;
    OrderBy?: {
        Expression: any;
        Asc: boolean
    }[];
    Union?: Statement;
    Positions?: Positions
}

export interface JsoqlEngine {
    ExecuteQuery(statement: Statement|string, context?: QueryContext): QueryResult;
    GetQueryHelp(jsoql: string, cursorPositionOrIndex: Position|number, context?: QueryContext): Q.Promise<HelpResult>;
}