var parser = require('../jsoql-parser').parser;

export function Parse(source: string): Statement {
    return parser.parse(source);
}

export interface Selectable {
    Expression: any;
    Alias: string;
}

export interface Statement {
    Select: {
        SelectList: Selectable[];
        Limit: number;
    }
    FromWhere: {
        From: any;
        Where: any;
    }
    GroupBy: any;
    OrderBy: {
        Expression: any;
        Asc: boolean
    }[]
}