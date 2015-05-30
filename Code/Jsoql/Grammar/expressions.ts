import tokens = require('./tokens')
import utils = require('../Scripts/utilities')
var lazy: LazyJS.LazyStatic = require('../Scripts/Hacks/lazy.js')

var val = tokens.values;
var keywords = tokens.keywords;

//function Exp(name: string, ...args: any[]) {
//}

//var Quoted = Exp('Quoted',
//    [val.Quotation, "{ Quoted: $1.replace(/'/g, \"\")}"]);

//var Boolean = Exp('Boolean',
//    [val.True, "true"],
//    [val.False, "false"]);

//var Identifier = Exp('Identifier',
//    val.PlainIdentifier);

//var Property = Exp('Property', (Property) => [
//    [Identifier, "{ Property: $1}"]
//    [[Identifier, '[', val.Number, ']'], "{ Property: $1, Index: $3}"]
//    [[Identifier, '.', Property], "{ Property: $1, Child: $3}"],
//    [[Identifier, '[', val.Number, ']', '.', Property], "{ Property: $1, Index: $3, Child: $6}"]
//]);

var exp = {
    Quoted: () => [
        [
            val.Quotation,
            "{ Quoted: $1.replace(/'/g, \"\")}"
        ]
    ],
    Boolean: () => [
        [
            val.True,
            "true"
        ],
        [
            val.False,
            "false"
        ]
    ],
    Identifier: () => [
        val.PlainIdentifier
    ],
    Property: () => [
        [
            exp.Identifier,
            "{ Property: $1}"
        ],
        [
            exp.Identifier + ' [ ' + val.Number + ' ]',
            "{ Property: $1, Index: $3}"
        ],
        [
            exp.Identifier + " . " + exp.Property,
            "{ Property: $1, Child: $3}"
        ],
        [
            exp.Identifier + " [ " + val.Number + " ] . " + exp.Property,
            "{ Property: $1, Index: $3, Child: $6}"
        ]
    ],
    Expression: () => [
        [
            exp.Identifier + " ( )",
            "{ Call: $1, Args: []}"
        ],
        [
            exp.Identifier + " ( " + exp.ExpressionList + " )",
            "{ Call: $1, Args: $3}"
        ],
        exp.Property,
        exp.Quoted,
        exp.Boolean,
        exp.Object,
        [
            val.Number,
            "parseFloat($1)"
        ],
        [
            exp.Expression + " " + keywords.AND + " " + exp.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            exp.Expression + " " + keywords.OR + " " + exp.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            exp.Expression + " = " + exp.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            exp.Expression + " != " + exp.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            exp.Expression + " > " + exp.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            exp.Expression + " >= " + exp.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            exp.Expression + " < " + exp.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            exp.Expression + " <= " + exp.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            exp.Expression + " + " + exp.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            "( " + exp.Stmt  + " )",
            "{SubQuery: $2}"
        ]
    ],
    KeyValue: () => [
        [
            exp.Identifier + " : " + exp.Expression,
            "{Key: $1, Value: $3}"
        ]
    ],
    KeyValueList: () => [
        [
            exp.KeyValue,
            "[$1]"
        ],
        [
           exp.KeyValueList + " , " + exp.KeyValue,
            "$1.concat([$3])"
        ]
    ],
    Object: () => [
        [
            "{ " + exp.KeyValueList + " }",
            "{KeyValues: $2}"
        ]
    ],
    ExpressionList: () => [
        [
            exp.Expression,
            "[$1]"
        ],
        [
            exp.ExpressionList + " , " + exp.Expression,
            "$1.concat([$3])"
        ]
    ],
    Selectable: () => [
        [
            exp.Expression,
            "{Expression: $1}"
        ],
        [
            exp.Expression + " " + keywords.AS + " " + exp.Identifier,
            "{ Expression: $1, Alias: $3}"
        ]
    ],
    SelectList:() => [
        [
            exp.Selectable,
            "[$1]"
        ],
        [
            exp.SelectList + " , " + exp.Selectable,
            "$1.concat([$3])"
        ]
    ],
    FromTarget: () =>  [
        exp.Property,
        exp.Quoted,
        exp.Object
    ],
    AliasedFromTarget: () => [
        [
            exp.FromTarget + " " + keywords.AS + " " + exp.Identifier,
            "{Target: $1, Alias: $3}"
        ]
    ],
    FromTargets: () => [
        exp.FromTarget,
        exp.AliasedFromTarget,
        [
            exp.FromTargets + " " + keywords.JOIN + " " + exp.AliasedFromTarget + " " + keywords.ON + " " + exp.Expression,
            "{ Left: $1, Right: $3, Expression: $5}"
        ],
        [
            exp.FromTargets + " " + keywords.OVER + " " + exp.Property + " " + keywords.AS  + " " + val.PlainIdentifier,
            "{ Left: $1, Over: $3, Alias: $5}"
        ]
    ],
    OrderByExpression: () => [
        [
            exp.Expression,
            " $$ = {Expression: $1, Asc: true}"
        ],
        [
            exp.Expression + " " + keywords.ASC,
            "{Expression: $1, Asc: true}"
        ],
        [
            exp.Expression + " " + keywords.DESC,
            "{Expression: $1, Asc: false}"
        ]
    ],
    OrderByList: () => [
        [
            exp.OrderByList + " , " + exp.OrderByExpression,
            "$1.concat([$3])"
        ],
        [
            exp.OrderByExpression,
            "[$1]"
        ]
    ],
    OrderByClause: () => [
        [
            keywords.ORDERBY + ' ' + exp.OrderByList,
            "$2"
        ]
    ],
    FromWhereClause: () => [
        [
            keywords.FROM + ' ' + exp.FromTargets,
            "{From: $2 }"
        ],
        [
            keywords.FROM + ' ' + exp.FromTargets + " " + keywords.WHERE + " " + exp.Expression,
            "{From: $2, Where: $4}"
        ]
    ],
    SelectClause: () =>  [
        [
            keywords.SELECTTOP + " " +  val.Number + " " + exp.SelectList,
            "{ SelectList: $3, Limit: $2}"
        ],
        [
            keywords.SELECT + " " + exp.SelectList,
            "{ SelectList: $2}"
        ]
    ],
    GroupByClause: () => [
        [
           keywords.GROUPBY + " " + exp.ExpressionList,
            "{ Groupings: $2}"
        ],
        [
            keywords.GROUPBY + " " + exp.ExpressionList + " " + keywords.HAVING + " " + exp.Expression,
            "{ Groupings: $2, Having: $4}"
        ]
    ],
    Stmt: () =>  [
        [
            exp.SelectClause + " " + exp.FromWhereClause,
            { Select: "$1", FromWhere: "$2", Positions: { Select: "@1", FromWhere: "@2" } }
        ],
        [
            exp.SelectClause + " " + exp.FromWhereClause + " " + exp.GroupByClause,
            { Select: "$1", FromWhere: "$2", GroupBy: "$3", Positions: { Select: "@1", FromWhere: "@2", GroupBy: "@3"} }
        ],
        [
            exp.SelectClause + " " + exp.FromWhereClause + " " + exp.GroupByClause + " " + exp.OrderByClause,
            { Select: "$1", FromWhere: "$2", GroupBy: "$3", OrderBy: "$4", Positions: { Select: "@1", FromWhere: "@2", GroupBy: "@3", OrderBy: "@4" } }
        ],
        [
            exp.SelectClause + " " + exp.FromWhereClause + " " + exp.OrderByClause,
            { Select: "$1", FromWhere: "$2", OrderBy: "$3", Positions: { Select: "@1", FromWhere: "@2", OrderBy: "@3" } }
        ]
    ]
}


var expressionDefs = {};
exp = tokens.keyValueSwitcheroo(exp, expressionDefs);

export function GetJisonExpressionsFull() {

    return lazy(exp)
        .pairs()
        .map(kv => [kv[0], expressionDefs[kv[0]]()
            .map(def => {
                if (utils.IsArray(def)) {
                    var output = def[1];
                    if (typeof output !== 'string') output = JSON.stringify(output).replace(/"/g, '');
                    output = output.match(/\s*\$\$\s=/) ? output : '$$ = ' + output;
                    return [def[0], output];
                }
                else return def;
            })
        ])
        .toObject();

}

export function GetJisonExpressionsHelpful() {

    var expressions = GetJisonExpressionsFull();
    
    //Allow incomplete select list
    expressions['SelectList'].push(
        [
            exp.SelectList + " , ",
            "$$ = $1"
        ]
    );

    //Allow empty select list
    expressions['SelectClause'].push(
        [
            keywords.SELECT,
            "$$ = { SelectList: []}"
        ]
    );

    return expressions;
}