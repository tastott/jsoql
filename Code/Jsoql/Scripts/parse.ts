var fullParser = require('../Grammar/jsoql-full-parser').parser;
var helpfulParser = require('../Grammar/jsoql-helpful-parser').parser;

export function ParseFull(source: string): Statement {
    var stmt : Statement = fullParser.parse(source);
    decrementLineNumbers(stmt.Positions);
    return stmt;
}

export function ParseHelpful(source: string): Statement {
    var stmt : Statement = helpfulParser.parse(source);
    decrementLineNumbers(stmt.Positions);
    return stmt;
}

//For some reason line numbers from JISON are one-based but column numbers are zero-based
//Decrement line number to zero-based so they are consistent
function decrementLineNumbers(positions: Positions) {
    Object.keys(positions).forEach(key => {
        --positions[key].first_line;
        --positions[key].last_line;
    });
}

export interface Selectable {
    Expression: any;
    Alias?: string;
}

export interface FromClauseNode {
    Target?: any;
    Left?: FromClauseNode;
    Right?: FromClauseNode;
    Expression: any;
    Over?: FromClauseNode;
    Alias?: string;
    KeyValues?: {
        Key: string;
        Value: any;
    }[];
    Quoted: string;
}

export interface GroupByClause {
    Groupings: any[];
    Having: any
}

export interface Range {
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
    }
    From: FromClauseNode;
    Where?: any;
    GroupBy?: GroupByClause;
    OrderBy?: {
        Expression: any;
        Asc: boolean
    }[];
    Positions?: Positions
}