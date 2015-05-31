export interface QueryContext {
    BaseDirectory?: string;
    Data?: { [key: string]: any[] };
}

export interface Group {
    Key: any;
    Items: any[];
}

export interface Datasource {
    Type: string;
    Value: any;
}

export interface QueryResult {
    Results?: any[];
    Errors?: string[];
    Datasources?: Datasource[];
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
