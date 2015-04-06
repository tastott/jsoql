/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

'.'					return '.'
'('					return '('
')'					return ')'
\s*\,\s*            return ','
\s*\<\=\s*			return '<='
\s*\<\s*			return '<'
\s*\>\=\s*			return '>='
\s*\>\s*			return '>'
\s*\!\=\s*          return '!='
\s*\=\s*            return '='
<<EOF>>             return 'EOF'
SELECT\s+           return 'SELECT'
\s+FROM\s+          return 'FROM'
\s+WHERE\s+         return 'WHERE'
\s+GROUP\sBY\s+     return 'GROUPBY'
\s+AS\s+			return 'AS'
'true'              return 'True'
'false'             return 'False'
\s+AND\s+           return 'AND'
\s+OR\s+			return 'OR'
[0-9\.-]+			return 'Number'
[A-Za-z0-9_]+       return 'Identifier'
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


Property
	: Identifier
		 { $$ = { Property: $1}}
	| Identifier '.' Property
		 { $$ = { Property: $1, Child: $3}}
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

FromClause
    : FromTarget
    ;


Stmt
    : SELECT SelectList FROM FromClause
        { $$ = { Select: $2, From: $4} }
	| SELECT SelectList FROM FromClause WHERE Expression
		{ $$ = { Select: $2, From: $4, Where: $6}}
    | SELECT SelectList FROM FromClause GROUPBY ExpressionList
		{ $$ = { Select: $2, From: $4, GroupBy: $6}}
    ;