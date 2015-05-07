/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

'.'					return '.'
'('					return '('
')'					return ')'
'['					return '['
']'					return ']'
\s*\,\s*            return ','
\s*\<\=\s*			return '<='
\s*\<\s*			return '<'
\s*\>\=\s*			return '>='
\s*\>\s*			return '>'
\s*\!\=\s*          return '!='
\s*\=\s*            return '='
<<EOF>>             return 'EOF'
\s*SELECT\sTOP\s+   return 'SELECTTOP'
\s*SELECT\s+        return 'SELECT'
\s+FROM\s+          return 'FROM'
\s+WHERE\s+         return 'WHERE'
\s+GROUP\sBY\s+     return 'GROUPBY'
\s+ORDER\sBY\s+     return 'ORDERBY'
\s+ASC\s*			return 'ASC'
\s+DESC\s*			return 'DESC'
\s+AS\s+			return 'AS'
\s+JOIN\s+			return 'JOIN'
\s+ON\s+			return 'ON'
'true'              return 'True'
'false'             return 'False'
\s+AND\s+           return 'AND'
\s+OR\s+			return 'OR'
\s*[0-9\.-]+\s*		return 'Number'
[A-Za-z0-9_\*]+     return 'PlainIdentifier'
\'[^\']+\'          return 'Quotation'
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
		{ $$ = { Call: $1}}
	| Identifier '(' Expression ')'
		{ $$ = { Call: $1, Arg: $3}}
    | Property
    | Quoted
    | Boolean  
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
	| '(' Stmt ')'
		{ $$ = {SubQuery: $2}}
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
    : Identifier
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

Stmt
    : SelectClause FROM FromWhere
        { $$ = { Select: $1, FromWhere: $3} }
    | SelectClause FROM FromWhere GROUPBY ExpressionList
		{ $$ = { Select: $1, FromWhere: $3, GroupBy: $5}}
	| SelectClause FROM FromWhere GROUPBY ExpressionList ORDERBY OrderByList
		{ $$ = { Select: $1, FromWhere: $3, GroupBy: $5, OrderBy: $7}}
	| SelectClause FROM FromWhere ORDERBY OrderByList
		{ $$ = { Select: $1, FromWhere: $3, OrderBy: $5}}
    ;