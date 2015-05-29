import tokens = require('./tokens')
import utils = require('../Scripts/utilities')

var lazy: LazyJS.LazyStatic = require('../Scripts/Hacks/lazy.js')

var values = tokens.values;
var keywords = tokens.keywords;

var expressions = {
    Quoted: () => [
        [
            values.Quotation,
            "{ Quoted: $1.replace(/'/g, \"\")}"
        ]
    ],
    Boolean: () => [
        [
            values.True,
            "true"
        ],
        [
            values.False,
            "false"
        ]
    ],
    Identifier: () => [
        values.PlainIdentifier,
        [
            "[ " + expressions.Quoted + " ]",
            "$2.Quoted"
        ]
    ],
    Property: () => [
        [
            expressions.Identifier,
            "{ Property: $1}"
        ],
        [
            expressions.Identifier + " [ " + values.Number + " ]",
            "{ Property: $1, Index: $3}"
        ],
        [
            expressions.Identifier + " . " + expressions.Property,
            "{ Property: $1, Child: $3}"
        ],
        [
            expressions.Identifier + " [ " + values.Number + " ] . " + expressions.Property,
            "{ Property: $1, Index: $3, Child: $6}"
        ]
    ],
    Expression: () => [
        [
            expressions.Identifier + " ( )",
            "{ Call: $1, Args: []}"
        ],
        [
            expressions.Identifier + " ( " + expressions.ExpressionList + " )",
            "{ Call: $1, Args: $3}"
        ],
        expressions.Property,
        expressions.Quoted,
        expressions.Boolean,
        expressions.Object,
        [
            values.Number,
            "parseFloat($1)"
        ],
        [
            expressions.Expression + " " + keywords.AND + " " + expressions.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            expressions.Expression + " " + keywords.OR + " " + expressions.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            expressions.Expression + " = " + expressions.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            expressions.Expression + " != " + expressions.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            expressions.Expression + " > " + expressions.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            expressions.Expression + " >= " + expressions.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            expressions.Expression + " < " + expressions.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            expressions.Expression + " <= " + expressions.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            expressions.Expression + " + " + expressions.Expression,
            "{Operator: $2.trim(), Args: [$1,$3]}"
        ],
        [
            "( " + expressions.Stmt  + " )",
            "{SubQuery: $2}"
        ]
    ],
    KeyValue: () => [
        [
            expressions.Identifier + " : " + expressions.Expression,
            "{Key: $1, Value: $3}"
        ]
    ],
    KeyValueList: () => [
        [
            expressions.KeyValue,
            "[$1]"
        ],
        [
           expressions.KeyValueList + " , " + expressions.KeyValue,
            "$1.concat([$3])"
        ]
    ],
    Object: () => [
        [
            "{ " + expressions.KeyValueList + " }",
            "{KeyValues: $2}"
        ]
    ],
    ExpressionList: () => [
        [
            expressions.Expression,
            "[$1]"
        ],
        [
            expressions.ExpressionList + " , " + expressions.Expression,
            "$1.concat([$3])"
        ]
    ],
    Selectable: () => [
        [
            expressions.Expression,
            "{Expression: $1}"
        ],
        [
            expressions.Expression + " " + keywords.AS + " " + expressions.Identifier,
            "{ Expression: $1, Alias: $3}"
        ]
    ],
    SelectList:() => [
        [
            expressions.Selectable,
            "[$1]"
        ],
        [
            expressions.SelectList + " , " + expressions.Selectable,
            "$1.concat([$3])"
        ]
    ],
    FromTarget: () =>  [
        expressions.Property,
        expressions.Quoted,
        expressions.Object
    ],
    AliasedFromTarget: () => [
        [
            expressions.FromTarget + " " + keywords.AS + " " + expressions.Identifier,
            "{Target: $1, Alias: $3}"
        ]
    ],
    FromClause: () => [
        expressions.FromTarget,
        expressions.AliasedFromTarget,
        [
            expressions.FromClause + " " + keywords.JOIN + " " + expressions.AliasedFromTarget + " " + keywords.ON + " " + expressions.Expression,
            "{ Left: $1, Right: $3, Expression: $5}"
        ],
        [
            expressions.FromClause + " " + keywords.OVER + " " + expressions.Property + " " + keywords.AS  + " " + values.PlainIdentifier,
            "{ Left: $1, Over: $3, Alias: $5}"
        ]
    ],
    OrderByExpression: () => [
        [
            expressions.Expression,
            " $$ = {Expression: $1, Asc: true}"
        ],
        [
            expressions.Expression + " " + keywords.ASC,
            "{Expression: $1, Asc: true}"
        ],
        [
            expressions.Expression + " " + keywords.DESC,
            "{Expression: $1, Asc: false}"
        ]
    ],
    OrderByList: () => [
        [
            expressions.OrderByList + " , " + expressions.OrderByExpression,
            "$1.concat([$3])"
        ],
        [
            expressions.OrderByExpression,
            "[$1]"
        ]
    ],
    FromWhere: () => [
        [
            expressions.FromClause,
            "{From: $1 }"
        ],
        [
            expressions.FromClause + " " + keywords.WHERE + " " + expressions.Expression,
            "{From: $1, Where: $3}"
        ]
    ],
    SelectClause: () =>  [
        [
            keywords.SELECTTOP + " " +  values.Number + " " + expressions.SelectList,
            "{ SelectList: $3, Limit: $2}"
        ],
        [
            keywords.SELECT + " " + expressions.SelectList,
            "{ SelectList: $2}"
        ]
    ],
    GroupByClause: () => [
        [
           keywords.GROUPBY + " " + expressions.ExpressionList,
            "{ Groupings: $2}"
        ],
        [
            keywords.GROUPBY + " " + expressions.ExpressionList + " " + keywords.HAVING + " " + expressions.Expression,
            "{ Groupings: $2, Having: $4}"
        ]
    ],
    Stmt: () =>  [
        [
            expressions.SelectClause + " " + keywords.FROM + " " + expressions.FromWhere,
            "{ Select: $1, FromWhere: $3} "
        ],
        [
            expressions.SelectClause + " " + keywords.FROM + " " + expressions.FromWhere + " " + expressions.GroupByClause,
            "{ Select: $1, FromWhere: $3, GroupBy: $4}"
        ],
        [
            expressions.SelectClause + " " + keywords.FROM + " " + expressions.FromWhere + " "
            + expressions.GroupByClause + " " + keywords.ORDERBY + " " + expressions.OrderByList,
            "{ Select: $1, FromWhere: $3, GroupBy: $4, OrderBy: $6}"
        ],
        [
            expressions.SelectClause + " " + keywords.FROM + " " + expressions.FromWhere + " " + keywords.ORDERBY + " " + expressions.OrderByList,
            "{ Select: $1, FromWhere: $3, OrderBy: $5}"
        ]
    ]
}

var expressionDefs = {};
expressions = tokens.keyValueSwitcheroo(expressions, expressionDefs);

export function GetJisonExpressions() {

    return lazy(expressions)
        .pairs()
        .map(kv => [kv[0], expressionDefs[kv[0]]()
            .map(def => {
                if (utils.IsArray(def) && !def[1].match(/\s*\$\$\s=/))
                    return [def[0], '$$ = ' + def[1]];
                else return def;
            })
        ])
        .toObject();

}