/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                 /* skip whitespace */
'.'					return '.'
'('					return '('
')'					return ')'
'['					return '['
']'					return ']'
','                 return ','

'<='		        return '<='
'<'			        return '<'
'>='		        return '>='
'>'			        return '>'
'!='                return '!='
'='                 return '='
'+'			        return '+'

<<EOF>>             return 'EOF'
SELECT\sTOP         return 'SELECTTOP'
SELECT              return 'SELECT'
FROM                return 'FROM'
WHERE               return 'WHERE'
GROUP\sBY           return 'GROUPBY'
HAVING              return 'HAVING'
ORDER\sBY           return 'ORDERBY'
ASC			        return 'ASC'
DESC		        return 'DESC'
AS			        return 'AS'
JOIN			    return 'JOIN'
ON			        return 'ON'
OVER		        return 'OVER'
'true'              return 'True'
'false'             return 'False'
AND                 return 'AND'
OR			        return 'OR'
[0-9\.-]+		    return 'Number'
[@A-Za-z0-9_\*]+    return 'PlainIdentifier'
\'[^\']+\'          return 'Quotation'

'{'                 return '{'
'}'                 return '}'
':'                 return ':'

.                   return 'INVALID'

/lex

/* operator associations and precedence */

%left 'AND' 'OR'
%left '=' '!=' '<' '>' '<=' '>='
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

Identifier
	: PlainIdentifier
	| '[' + Quoted + ']'
		{ $$ = $2.Quoted}
	;

Property
	: Identifier
		 { $$ = { Property: $1}}
	| Identifier '[' Number ']'
		 { $$ = { Property: $1, Index: $3}}
	| Identifier '.' Property
		 { $$ = { Property: $1, Child: $3}}
	| Identifier  '[' Number ']' '.' Property
		 { $$ = { Property: $1, Index: $3, Child: $6}}
	;

Expression
	: Identifier '(' ')'
		{ $$ = { Call: $1, Args: []}}
	| Identifier '(' ExpressionList ')'
		{ $$ = { Call: $1, Args: $3}}
    | Property
    | Quoted
    | Boolean  
    | Object
	| Number
		{ $$ = parseFloat($1)}
	| Expression 'AND' Expression
		{ $$ = {Operator: $2.trim(), Args: [$1,$3]}}
	| Expression 'OR' Expression
		{ $$ = {Operator: $2.trim(), Args: [$1,$3]}}
	| Expression '=' Expression
		{ $$ = {Operator: $2.trim(), Args: [$1,$3]}}
	| Expression '!=' Expression
		{ $$ = {Operator: $2.trim(), Args: [$1,$3]}}
	| Expression '>' Expression
		{ $$ = {Operator: $2.trim(), Args: [$1,$3]}}
	| Expression '>=' Expression
		{ $$ = {Operator: $2.trim(), Args: [$1,$3]}}
	| Expression '<' Expression
		{ $$ = {Operator: $2.trim(), Args: [$1,$3]}}
	| Expression '<=' Expression
		{ $$ = {Operator: $2.trim(), Args: [$1,$3]}}
	| Expression '+' Expression
		{ $$ = {Operator: $2.trim(), Args: [$1,$3]}}
	| '(' Stmt ')'
		{ $$ = {SubQuery: $2}}
    ;

KeyValue
    : Identifier ':' Expression
        { $$ = {Key: $1, Value: $3}}
    ;

KeyValueList
    : KeyValue
        { $$ = [$1]}
    | KeyValueList ',' KeyValue
        { $$ = $1.concat([$3])}
    ;

Object
    : '{' KeyValueList '}'
        { $$ = {KeyValues: $2}}
    ;

ExpressionList
    : Expression
        { $$ = [$1]}
    | ExpressionList ',' Expression
        { $$ = $1.concat([$3])}
    ;


Selectable
	: Expression
		{ $$ = {Expression: $1}}
	| Expression 'AS' Identifier
		{ $$ = { Expression: $1, Alias: $3}}
	;

SelectList
	: Selectable
		{ $$ = [$1]}
	| SelectList ',' Selectable
		 { $$ = $1.concat([$3])}
	;

FromTarget
    : Property
    | Quoted
    ;

AliasedFromTarget
	: FromTarget AS Identifier
		{ $$ = {Target: $1, Alias: $3}}
	;

FromClause
    : FromTarget
	| AliasedFromTarget
	| FromClause JOIN AliasedFromTarget ON Expression
		{ $$ = { Left: $1, Right: $3, Expression: $5}}
	| FromClause OVER Property AS 'PlainIdentifier'
		{ $$ = { Left: $1, Over: $3, Alias: $5}}
    ;

OrderByExpression
	: Expression
		{ $$ = {Expression: $1, Asc: true}}
	| Expression ASC
		{ $$ = {Expression: $1, Asc: true}}
	| Expression DESC
		{ $$ = {Expression: $1, Asc: false}}
	;

OrderByList
	: OrderByList ',' OrderByExpression 
		{ $$ = $1.concat([$3])}
	| OrderByExpression
		{ $$ = [$1]}
	;

FromWhere
	: FromClause
		{ $$ = {From: $1 }}
	| FromClause WHERE Expression
		{ $$ = {From: $1, Where: $3}}
	;

SelectClause
    : SELECTTOP Number SelectList
        { $$ = { SelectList: $3, Limit: $2}}
    | SELECT SelectList
        { $$ = { SelectList: $2}}
    ;

GroupByClause
    : GROUPBY ExpressionList
        { $$ = { Groupings: $2}}
    | GROUPBY ExpressionList HAVING Expression
        { $$ = { Groupings: $2, Having: $4}}
    ;

Stmt
    : SelectClause FROM FromWhere
        { $$ = { Select: $1, FromWhere: $3} }
    | SelectClause FROM FromWhere GroupByClause
		{ $$ = { Select: $1, FromWhere: $3, GroupBy: $4}}
	| SelectClause FROM FromWhere GroupByClause ORDERBY OrderByList
		{ $$ = { Select: $1, FromWhere: $3, GroupBy: $4, OrderBy: $6}}
	| SelectClause FROM FromWhere ORDERBY OrderByList
		{ $$ = { Select: $1, FromWhere: $3, OrderBy: $5}}
    ;