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
    Value: string;
}

export interface QueryResult {
    Results?: any[];
    Errors?: string[];
    Datasources?: Datasource[];
}