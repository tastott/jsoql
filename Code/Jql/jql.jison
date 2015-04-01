/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

'.'                   return '.'
\s*\,\s*                  return ','
\s*\!\=\s*               return '!='
\s*\=\s*               return '='
<<EOF>>               return 'EOF'
SELECT\s+             return 'SELECT'
\s+FROM\s+               return 'FROM'
\s+WHERE\s+               return 'WHERE'
'true'                      return 'True'
'false'                     return 'False'
\s+AND\s+                   return 'AND'
[^,^\s^\'^\.^=]+              return 'Property'
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

Selectable
    : Property
        { $$ = { Property: $1}}
    | Quoted
    | Boolean
    | Property '.' Selectable
        { $$ = { Property: $1, Child: $3}}
    ;

SelectList
    : Selectable
        { $$ = [$1]}
    | SelectList ',' Selectable
        { $$ = $1.concat([$3])}
    ;

WhereCondition
    : Selectable '=' Selectable
        { $$ = { Operator: '=', Args: [$1, $3]}}
    | Selectable '!=' Selectable
        { $$ = { Operator: '!=', Args: [$1, $3]}}
    | WhereCondition AND WhereCondition
        { $$ = { Operator: 'AND', Args: [$1, $3]}}
    ;

WhereClause
    : WhereCondition
    ;

FromTarget
    : Property
    | Quoted
    ;

FromClause
    : FromTarget
    ;


Stmt
    : SELECT SelectList FROM FromClause
        { $$ = { Select: $2, From: $4} }
	| SELECT SelectList FROM FromClause WHERE WhereClause
		{ $$ = { Select: $2, From: $4, Where: $6 }}
    ;