var lazy : LazyJS.LazyStatic = require('../Scripts/Hacks/lazy.js')

var selfNamedTokens = [
    '.',
    '(',
    ')',
    '[',
    ']',
    ',',

    '<=',
    '<',
    '>=',
    '>',
    '!=',
    '=',
    '+',
    '-',
    '*',
    '/',

    '{',
    '}',
    ':'
];

export var keywords = {
    SELECTTOP: 'SELECT TOP',
    SELECT: 'SELECT',
    FROM: 'FROM',
    WHERE: 'WHERE',
    GROUPBY: 'GROUP BY',
    HAVING: 'HAVING',
    ORDERBY: 'ORDER BY',
    ASC: 'ASC',
    DESC: 'DESC',
    AS: 'AS',
    JOIN: 'JOIN',
    ON: 'ON',
    OVER: 'OVER',
    AND: 'AND',
    OR: 'OR',
    IS: 'IS',
    NOT: 'NOT',
    IN: 'IN',
    UNION: 'UNION'
};

var keywordPatterns = {};
keywords = keyValueSwitcheroo(keywords, keywordPatterns);

export var values = {
    True: 'true',
    False: 'false',
    Null: "NULL",
    Undefined: "UNDEFINED",
    Number: '[0-9\.]+',
    PlainIdentifier: '[@A-Za-z0-9_]+',
    Quotation: "'[^']*'",
    DoubleQuotation: "\"[^\"]*\""
};

var valuePatterns = {};
values = keyValueSwitcheroo(values, valuePatterns);

function RegexEscape(s: string) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function keyValueSwitcheroo(target: Object, valuesDict : any):any {
    return lazy(target)
        .pairs()
        .map(kv => {
            //Replace value with key and store it in dictionary
            valuesDict[kv[0]] = kv[1];
            return [kv[0], kv[0]];
        })
        .toObject();
}

export function GetJisonTokens(): string[][]{

    return [
        ['\\.\\s', "return 'TrailingDot'"],
        ['\\.$', "return 'FinalDot'"],
        ['--.*', '/* ignore comment */']
    ].concat(
        selfNamedTokens.map(t => [RegexEscape(t), "return '" + t + "'"]),
        Object.keys(keywords).map(kw => [keywordPatterns[kw], "return '" + kw + "'"]),
        Object.keys(values).map(v => [valuePatterns[v], "return '" + v + "'"]),
        [
            ['$', "return 'EOF'"],
            ['\\s+', '/* ignore whitespace */'],
            ['.', "return 'INVALID'"]
        ]
    );
}