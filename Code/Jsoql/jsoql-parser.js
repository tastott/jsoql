/* parser generated by jison 0.4.13 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"Stmt":4,"EOF":5,"Quoted":6,"Quotation":7,"Boolean":8,"True":9,"False":10,"Identifier":11,"PlainIdentifier":12,"[":13,"]":14,"Property":15,"Number":16,".":17,"Expression":18,"(":19,")":20,"AND":21,"OR":22,"=":23,"!=":24,">":25,">=":26,"<":27,"<=":28,"ExpressionList":29,",":30,"Selectable":31,"AS":32,"SelectList":33,"FromTarget":34,"AliasedFromTarget":35,"FromClause":36,"JOIN":37,"ON":38,"OrderByExpression":39,"ASC":40,"DESC":41,"OrderByList":42,"FromWhere":43,"WHERE":44,"SELECT":45,"FROM":46,"GROUPBY":47,"ORDERBY":48,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"Quotation",9:"True",10:"False",12:"PlainIdentifier",13:"[",14:"]",16:"Number",17:".",19:"(",20:")",21:"AND",22:"OR",23:"=",24:"!=",25:">",26:">=",27:"<",28:"<=",30:",",32:"AS",37:"JOIN",38:"ON",40:"ASC",41:"DESC",44:"WHERE",45:"SELECT",46:"FROM",47:"GROUPBY",48:"ORDERBY"},
productions_: [0,[3,2],[6,1],[8,1],[8,1],[11,1],[11,3],[15,1],[15,4],[15,3],[15,6],[18,3],[18,4],[18,1],[18,1],[18,1],[18,1],[18,3],[18,3],[18,3],[18,3],[18,3],[18,3],[18,3],[18,3],[29,1],[29,3],[31,1],[31,3],[33,1],[33,3],[34,1],[34,1],[35,3],[36,1],[36,1],[36,5],[39,1],[39,2],[39,2],[42,3],[42,1],[43,1],[43,3],[4,4],[4,6],[4,8],[4,6]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */
/**/) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:return $$[$0-1];
break;
case 2: this.$ = { Quoted: $$[$0].replace(/'/g, "")}
break;
case 3: this.$ = true
break;
case 4: this.$ = false 
break;
case 6: this.$ = $$[$0-1].Quoted
break;
case 7: this.$ = { Property: $$[$0]}
break;
case 8: this.$ = { Property: $$[$0-3], Index: $$[$0-1]}
break;
case 9: this.$ = { Property: $$[$0-2], Child: $$[$0]}
break;
case 10: this.$ = { Property: $$[$0-5], Index: $$[$0-3], Child: $$[$0]}
break;
case 11: this.$ = { Call: $$[$0-2]}
break;
case 12: this.$ = { Call: $$[$0-3], Arg: $$[$0-1]}
break;
case 16: this.$ = parseFloat($$[$0])
break;
case 17: this.$ = {Operator: $$[$0-1].trim(), Args: [$$[$0-2],$$[$0]]}
break;
case 18: this.$ = {Operator: $$[$0-1].trim(), Args: [$$[$0-2],$$[$0]]}
break;
case 19: this.$ = {Operator: $$[$0-1].trim(), Args: [$$[$0-2],$$[$0]]}
break;
case 20: this.$ = {Operator: $$[$0-1].trim(), Args: [$$[$0-2],$$[$0]]}
break;
case 21: this.$ = {Operator: $$[$0-1].trim(), Args: [$$[$0-2],$$[$0]]}
break;
case 22: this.$ = {Operator: $$[$0-1].trim(), Args: [$$[$0-2],$$[$0]]}
break;
case 23: this.$ = {Operator: $$[$0-1].trim(), Args: [$$[$0-2],$$[$0]]}
break;
case 24: this.$ = {Operator: $$[$0-1].trim(), Args: [$$[$0-2],$$[$0]]}
break;
case 25: this.$ = [$$[$0]]
break;
case 26: this.$ = $$[$0-2].concat([$$[$0]])
break;
case 27: this.$ = {Expression: $$[$0]}
break;
case 28: this.$ = { Expression: $$[$0-2], Alias: $$[$0]}
break;
case 29: this.$ = [$$[$0]]
break;
case 30: this.$ = $$[$0-2].concat([$$[$0]])
break;
case 33: this.$ = {Target: $$[$0-2], Alias: $$[$0]}
break;
case 36: this.$ = { Left: $$[$0-4], Right: $$[$0-2], Expression: $$[$0]}
break;
case 37: this.$ = {Expression: $$[$0], Asc: true}
break;
case 38: this.$ = {Expression: $$[$0-1], Asc: true}
break;
case 39: this.$ = {Expression: $$[$0-1], Asc: false}
break;
case 40: this.$ = $$[$0-2].concat([$$[$0]])
break;
case 41: this.$ = [$$[$0]]
break;
case 42: this.$ = {From: $$[$0] }
break;
case 43: this.$ = {From: $$[$0-2], Where: $$[$0]}
break;
case 44: this.$ = { Select: $$[$0-2], FromWhere: $$[$0]} 
break;
case 45: this.$ = { Select: $$[$0-4], FromWhere: $$[$0-2], GroupBy: $$[$0]}
break;
case 46: this.$ = { Select: $$[$0-6], FromWhere: $$[$0-4], GroupBy: $$[$0-2], OrderBy: $$[$0]}
break;
case 47: this.$ = { Select: $$[$0-4], FromWhere: $$[$0-2], OrderBy: $$[$0]}
break;
}
},
table: [{3:1,4:2,45:[1,3]},{1:[3]},{5:[1,4]},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:7,31:6,33:5},{1:[2,1]},{30:[1,19],46:[1,18]},{30:[2,29],46:[2,29]},{21:[1,21],22:[1,22],23:[1,23],24:[1,24],25:[1,25],26:[1,26],27:[1,27],28:[1,28],30:[2,27],32:[1,20],46:[2,27]},{5:[2,7],13:[1,30],17:[1,31],19:[1,29],20:[2,7],21:[2,7],22:[2,7],23:[2,7],24:[2,7],25:[2,7],26:[2,7],27:[2,7],28:[2,7],30:[2,7],32:[2,7],37:[2,7],40:[2,7],41:[2,7],44:[2,7],46:[2,7],47:[2,7],48:[2,7]},{5:[2,13],20:[2,13],21:[2,13],22:[2,13],23:[2,13],24:[2,13],25:[2,13],26:[2,13],27:[2,13],28:[2,13],30:[2,13],32:[2,13],37:[2,13],40:[2,13],41:[2,13],44:[2,13],46:[2,13],47:[2,13],48:[2,13]},{5:[2,14],20:[2,14],21:[2,14],22:[2,14],23:[2,14],24:[2,14],25:[2,14],26:[2,14],27:[2,14],28:[2,14],30:[2,14],32:[2,14],37:[2,14],40:[2,14],41:[2,14],44:[2,14],46:[2,14],47:[2,14],48:[2,14]},{5:[2,15],20:[2,15],21:[2,15],22:[2,15],23:[2,15],24:[2,15],25:[2,15],26:[2,15],27:[2,15],28:[2,15],30:[2,15],32:[2,15],37:[2,15],40:[2,15],41:[2,15],44:[2,15],46:[2,15],47:[2,15],48:[2,15]},{5:[2,16],20:[2,16],21:[2,16],22:[2,16],23:[2,16],24:[2,16],25:[2,16],26:[2,16],27:[2,16],28:[2,16],30:[2,16],32:[2,16],37:[2,16],40:[2,16],41:[2,16],44:[2,16],46:[2,16],47:[2,16],48:[2,16]},{5:[2,5],13:[2,5],17:[2,5],19:[2,5],20:[2,5],21:[2,5],22:[2,5],23:[2,5],24:[2,5],25:[2,5],26:[2,5],27:[2,5],28:[2,5],30:[2,5],32:[2,5],37:[2,5],38:[2,5],40:[2,5],41:[2,5],44:[2,5],46:[2,5],47:[2,5],48:[2,5]},{6:32,7:[1,15]},{5:[2,2],14:[2,2],20:[2,2],21:[2,2],22:[2,2],23:[2,2],24:[2,2],25:[2,2],26:[2,2],27:[2,2],28:[2,2],30:[2,2],32:[2,2],37:[2,2],40:[2,2],41:[2,2],44:[2,2],46:[2,2],47:[2,2],48:[2,2]},{5:[2,3],20:[2,3],21:[2,3],22:[2,3],23:[2,3],24:[2,3],25:[2,3],26:[2,3],27:[2,3],28:[2,3],30:[2,3],32:[2,3],37:[2,3],40:[2,3],41:[2,3],44:[2,3],46:[2,3],47:[2,3],48:[2,3]},{5:[2,4],20:[2,4],21:[2,4],22:[2,4],23:[2,4],24:[2,4],25:[2,4],26:[2,4],27:[2,4],28:[2,4],30:[2,4],32:[2,4],37:[2,4],40:[2,4],41:[2,4],44:[2,4],46:[2,4],47:[2,4],48:[2,4]},{6:38,7:[1,15],11:37,12:[1,13],13:[1,14],34:35,35:36,36:34,43:33},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:7,31:39},{11:40,12:[1,13],13:[1,14]},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:41},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:42},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:43},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:44},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:45},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:46},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:47},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:48},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:50,20:[1,49]},{16:[1,51]},{11:53,12:[1,13],13:[1,14],15:52},{14:[1,54]},{5:[2,44],47:[1,55],48:[1,56]},{5:[2,42],37:[1,58],44:[1,57],47:[2,42],48:[2,42]},{5:[2,34],32:[1,59],37:[2,34],44:[2,34],47:[2,34],48:[2,34]},{5:[2,35],37:[2,35],44:[2,35],47:[2,35],48:[2,35]},{5:[2,31],32:[2,31],37:[2,31],44:[2,31],47:[2,31],48:[2,31]},{5:[2,32],32:[2,32],37:[2,32],44:[2,32],47:[2,32],48:[2,32]},{30:[2,30],46:[2,30]},{30:[2,28],46:[2,28]},{5:[2,17],20:[2,17],21:[2,17],22:[2,17],23:[1,23],24:[1,24],25:[1,25],26:[1,26],27:[1,27],28:[1,28],30:[2,17],32:[2,17],37:[2,17],40:[2,17],41:[2,17],44:[2,17],46:[2,17],47:[2,17],48:[2,17]},{5:[2,18],20:[2,18],21:[2,18],22:[2,18],23:[1,23],24:[1,24],25:[1,25],26:[1,26],27:[1,27],28:[1,28],30:[2,18],32:[2,18],37:[2,18],40:[2,18],41:[2,18],44:[2,18],46:[2,18],47:[2,18],48:[2,18]},{5:[2,19],20:[2,19],21:[2,19],22:[2,19],23:[2,19],24:[2,19],25:[2,19],26:[2,19],27:[2,19],28:[2,19],30:[2,19],32:[2,19],37:[2,19],40:[2,19],41:[2,19],44:[2,19],46:[2,19],47:[2,19],48:[2,19]},{5:[2,20],20:[2,20],21:[2,20],22:[2,20],23:[2,20],24:[2,20],25:[2,20],26:[2,20],27:[2,20],28:[2,20],30:[2,20],32:[2,20],37:[2,20],40:[2,20],41:[2,20],44:[2,20],46:[2,20],47:[2,20],48:[2,20]},{5:[2,21],20:[2,21],21:[2,21],22:[2,21],23:[2,21],24:[2,21],25:[2,21],26:[2,21],27:[2,21],28:[2,21],30:[2,21],32:[2,21],37:[2,21],40:[2,21],41:[2,21],44:[2,21],46:[2,21],47:[2,21],48:[2,21]},{5:[2,22],20:[2,22],21:[2,22],22:[2,22],23:[2,22],24:[2,22],25:[2,22],26:[2,22],27:[2,22],28:[2,22],30:[2,22],32:[2,22],37:[2,22],40:[2,22],41:[2,22],44:[2,22],46:[2,22],47:[2,22],48:[2,22]},{5:[2,23],20:[2,23],21:[2,23],22:[2,23],23:[2,23],24:[2,23],25:[2,23],26:[2,23],27:[2,23],28:[2,23],30:[2,23],32:[2,23],37:[2,23],40:[2,23],41:[2,23],44:[2,23],46:[2,23],47:[2,23],48:[2,23]},{5:[2,24],20:[2,24],21:[2,24],22:[2,24],23:[2,24],24:[2,24],25:[2,24],26:[2,24],27:[2,24],28:[2,24],30:[2,24],32:[2,24],37:[2,24],40:[2,24],41:[2,24],44:[2,24],46:[2,24],47:[2,24],48:[2,24]},{5:[2,11],20:[2,11],21:[2,11],22:[2,11],23:[2,11],24:[2,11],25:[2,11],26:[2,11],27:[2,11],28:[2,11],30:[2,11],32:[2,11],37:[2,11],40:[2,11],41:[2,11],44:[2,11],46:[2,11],47:[2,11],48:[2,11]},{20:[1,60],21:[1,21],22:[1,22],23:[1,23],24:[1,24],25:[1,25],26:[1,26],27:[1,27],28:[1,28]},{14:[1,61]},{5:[2,9],20:[2,9],21:[2,9],22:[2,9],23:[2,9],24:[2,9],25:[2,9],26:[2,9],27:[2,9],28:[2,9],30:[2,9],32:[2,9],37:[2,9],40:[2,9],41:[2,9],44:[2,9],46:[2,9],47:[2,9],48:[2,9]},{5:[2,7],13:[1,30],17:[1,31],20:[2,7],21:[2,7],22:[2,7],23:[2,7],24:[2,7],25:[2,7],26:[2,7],27:[2,7],28:[2,7],30:[2,7],32:[2,7],37:[2,7],40:[2,7],41:[2,7],44:[2,7],46:[2,7],47:[2,7],48:[2,7]},{5:[2,6],13:[2,6],17:[2,6],19:[2,6],20:[2,6],21:[2,6],22:[2,6],23:[2,6],24:[2,6],25:[2,6],26:[2,6],27:[2,6],28:[2,6],30:[2,6],32:[2,6],37:[2,6],38:[2,6],40:[2,6],41:[2,6],44:[2,6],46:[2,6],47:[2,6],48:[2,6]},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:63,29:62},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:66,39:65,42:64},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:67},{6:38,7:[1,15],11:37,12:[1,13],13:[1,14],34:69,35:68},{11:70,12:[1,13],13:[1,14]},{5:[2,12],20:[2,12],21:[2,12],22:[2,12],23:[2,12],24:[2,12],25:[2,12],26:[2,12],27:[2,12],28:[2,12],30:[2,12],32:[2,12],37:[2,12],40:[2,12],41:[2,12],44:[2,12],46:[2,12],47:[2,12],48:[2,12]},{5:[2,8],17:[1,71],20:[2,8],21:[2,8],22:[2,8],23:[2,8],24:[2,8],25:[2,8],26:[2,8],27:[2,8],28:[2,8],30:[2,8],32:[2,8],37:[2,8],40:[2,8],41:[2,8],44:[2,8],46:[2,8],47:[2,8],48:[2,8]},{5:[2,45],30:[1,73],48:[1,72]},{5:[2,25],21:[1,21],22:[1,22],23:[1,23],24:[1,24],25:[1,25],26:[1,26],27:[1,27],28:[1,28],30:[2,25],48:[2,25]},{5:[2,47],30:[1,74]},{5:[2,41],30:[2,41]},{5:[2,37],21:[1,21],22:[1,22],23:[1,23],24:[1,24],25:[1,25],26:[1,26],27:[1,27],28:[1,28],30:[2,37],40:[1,75],41:[1,76]},{5:[2,43],21:[1,21],22:[1,22],23:[1,23],24:[1,24],25:[1,25],26:[1,26],27:[1,27],28:[1,28],47:[2,43],48:[2,43]},{38:[1,77]},{32:[1,59]},{5:[2,33],37:[2,33],38:[2,33],44:[2,33],47:[2,33],48:[2,33]},{11:53,12:[1,13],13:[1,14],15:78},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:66,39:65,42:79},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:80},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:66,39:81},{5:[2,38],30:[2,38]},{5:[2,39],30:[2,39]},{6:10,7:[1,15],8:11,9:[1,16],10:[1,17],11:8,12:[1,13],13:[1,14],15:9,16:[1,12],18:82},{5:[2,10],20:[2,10],21:[2,10],22:[2,10],23:[2,10],24:[2,10],25:[2,10],26:[2,10],27:[2,10],28:[2,10],30:[2,10],32:[2,10],37:[2,10],40:[2,10],41:[2,10],44:[2,10],46:[2,10],47:[2,10],48:[2,10]},{5:[2,46],30:[1,74]},{5:[2,26],21:[1,21],22:[1,22],23:[1,23],24:[1,24],25:[1,25],26:[1,26],27:[1,27],28:[1,28],30:[2,26],48:[2,26]},{5:[2,40],30:[2,40]},{5:[2,36],21:[1,21],22:[1,22],23:[1,23],24:[1,24],25:[1,25],26:[1,26],27:[1,27],28:[1,28],37:[2,36],44:[2,36],47:[2,36],48:[2,36]}],
defaultActions: {4:[2,1]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                this.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START
/**/) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 17
break;
case 1:return 19
break;
case 2:return 20
break;
case 3:return 13
break;
case 4:return 14
break;
case 5:return 30
break;
case 6:return 28
break;
case 7:return 27
break;
case 8:return 26
break;
case 9:return 25
break;
case 10:return 24
break;
case 11:return 23
break;
case 12:return 5
break;
case 13:return 45
break;
case 14:return 46
break;
case 15:return 44
break;
case 16:return 47
break;
case 17:return 48
break;
case 18:return 40
break;
case 19:return 41
break;
case 20:return 32
break;
case 21:return 37
break;
case 22:return 38
break;
case 23:return 9
break;
case 24:return 10
break;
case 25:return 21
break;
case 26:return 22
break;
case 27:return 16
break;
case 28:return 12
break;
case 29:return 7
break;
case 30:return 'INVALID'
break;
}
},
rules: [/^(?:\.)/,/^(?:\()/,/^(?:\))/,/^(?:\[)/,/^(?:\])/,/^(?:\s*,\s*)/,/^(?:\s*<=\s*)/,/^(?:\s*<\s*)/,/^(?:\s*>=\s*)/,/^(?:\s*>\s*)/,/^(?:\s*!=\s*)/,/^(?:\s*=\s*)/,/^(?:$)/,/^(?:SELECT\s+)/,/^(?:\s+FROM\s+)/,/^(?:\s+WHERE\s+)/,/^(?:\s+GROUP\sBY\s+)/,/^(?:\s+ORDER\sBY\s+)/,/^(?:\s+ASC\s*)/,/^(?:\s+DESC\s*)/,/^(?:\s+AS\s+)/,/^(?:\s+JOIN\s+)/,/^(?:\s+ON\s+)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:\s+AND\s+)/,/^(?:\s+OR\s+)/,/^(?:[0-9\.-]+)/,/^(?:[A-Za-z0-9_\*]+)/,/^(?:'[^\']+')/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}