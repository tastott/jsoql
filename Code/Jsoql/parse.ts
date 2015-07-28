import m = require('./models')
var fullParser = require('./Grammar/jsoql-full-parser').parser;
var helpfulParser = require('./Grammar/jsoql-helpful-parser').parser;

export function ParseFull(source: string): m.Statement {
    var stmt : m.Statement = fullParser.parse(source);
    decrementLineNumbers(stmt.Positions);
    return stmt;
}

export function ParseHelpful(source: string): m.Statement {
    var stmt : m.Statement = helpfulParser.parse(source);
    decrementLineNumbers(stmt.Positions);
    return stmt;
}

//For some reason line numbers from JISON are one-based but column numbers are zero-based
//Decrement line number to zero-based so they are consistent
function decrementLineNumbers(positions: m.Positions) {
    Object.keys(positions).forEach(key => {
        --positions[key].first_line;
        --positions[key].last_line;
    });
}

