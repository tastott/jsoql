/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

'.'                   return '.'
'('						return '('
')'						return ')'
\s*\,\s*                  return ','
\s*\!\=\s*               return '!='
\s*\=\s*               return '='
<<EOF>>               return 'EOF'
SELECT\s+             return 'SELECT'
\s+FROM\s+               return 'FROM'
\s+WHERE\s+               return 'WHERE'
\s+GROUP\sBY\s+             return 'GROUPBY'
'true'                      return 'True'
'false'                     return 'False'
\s+AND\s+                   return 'AND'
[A-Za-z0-9_]+       return 'Identifier'
\'[^\']+\'               return 'Quotation'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%left 'AND'
%left '+' '-'
%left '*' '/'
%left '^'
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : Stmt EOF
        {return $1;}
    ;

Quoted
    : Quotation
        { $$ = { Quoted: $1.replace(/'/g, "")}}
    ;

Boolean
    : True
        { $$ = true}
    | False
        { $$ = false }
    ;


Expression
	: Identifier '(' ')'
		{ $$ = { Call: $1}}
	| Identifier '(' Expression ')'
		{ $$ = { Call: $1, Arg: $3}}
    | Identifier
        { $$ = { Property: $1}}
    | Quoted
    | Boolean
    | Identifier '.' Identifier
        { $$ = { Property: $1, Child: $3}}
    ;


ExpressionList
    : Expression
        { $$ = [$1]}
    | ExpressionList ',' Expression
        { $$ = $1.concat([$3])}
    ;

WhereCondition
    : Expression '=' Expression
        { $$ = { Operator: '=', Args: [$1, $3]}}
    | Expression '!=' Expression
        { $$ = { Operator: '!=', Args: [$1, $3]}}
    | WhereCondition AND WhereCondition
        { $$ = { Operator: 'AND', Args: [$1, $3]}}
    ;

WhereClause
    : WhereCondition
    ;

FromTarget
    : Identifier
    | Quoted
    ;

FromClause
    : FromTarget
    ;


Stmt
    : SELECT ExpressionList FROM FromClause
        { $$ = { Select: $2, From: $4} }
	| SELECT ExpressionList FROM FromClause WHERE WhereClause
		{ $$ = { Select: $2, From: $4, Where: $6}}
    | SELECT ExpressionList FROM FromClause GROUPBY ExpressionList
		{ $$ = { Select: $2, From: $4, GroupBy: $6}}
    ;