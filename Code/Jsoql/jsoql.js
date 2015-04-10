///<reference path="typings/node/node.d.ts"/>
var Jsoql;
(function (Jsoql) {
    var Parse;
    (function (_Parse) {
        var parser = require('./jsoql-parser').parser;
        function Parse(source) {
            return parser.parse(source);
        }
        _Parse.Parse = Parse;
        ;
    })(Parse = Jsoql.Parse || (Jsoql.Parse = {}));
})(Jsoql || (Jsoql = {}));
var Jsoql;
(function (Jsoql) {
    var Utilities;
    (function (Utilities) {
        function IsArray(value) {
            return Object.prototype.toString.call(value) === '[object Array]';
        }
        Utilities.IsArray = IsArray;
    })(Utilities = Jsoql.Utilities || (Jsoql.Utilities = {}));
})(Jsoql || (Jsoql = {}));
///<reference path="utilities.ts" />
///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/lazyjs/lazyjs.d.ts"/>
///<reference path="typings/q/Q.d.ts"/>
var Jsoql;
(function (Jsoql) {
    var Query;
    (function (Query) {
        var fs = require('fs');
        var lazy = require('lazy.js');
        var Q = require('q');
        //import parse = require('./parse')
        //var util = require('./utilities')
        var clone = require('clone');
        var DefaultDataSource = (function () {
            function DefaultDataSource() {
            }
            DefaultDataSource.prototype.Get = function (value) {
                if (!fs.existsSync(value)) {
                    throw new Error('File not found: ' + value + '. Cwd is ' + process.cwd());
                }
                else {
                    var seq = lazy.readFile(value, 'utf8').split('\r\n').map(function (line) {
                        try {
                            return JSON.parse(line);
                        }
                        catch (err) {
                            throw 'Failed to parse line: ' + line;
                        }
                    });
                    return seq;
                }
            };
            return DefaultDataSource;
        })();
        var ArrayDataSource = (function () {
            function ArrayDataSource(arrays) {
                this.arrays = arrays;
            }
            ArrayDataSource.prototype.Get = function (value) {
                return lazy(this.arrays[value]);
            };
            return ArrayDataSource;
        })();
        var operators = {
            '=': function (args) { return args[0] == args[1]; },
            '!=': function (args) { return args[0] !== args[1]; },
            '>': function (args) { return args[0] > args[1]; },
            '>=': function (args) { return args[0] >= args[1]; },
            '<': function (args) { return args[0] < args[1]; },
            '<=': function (args) { return args[0] <= args[1]; },
            'and': function (args) { return args[0] && args[1]; },
            'or': function (args) { return args[0] || args[1]; }
        };
        var aggregateFunctions = {
            'count': function (items) { return items.length; },
            'max': function (items) { return lazy(items).max(); },
            'min': function (items) { return lazy(items).min(); },
            'sum': function (items) { return lazy(items).sum(); },
            'avg': function (items) {
                var count = items.length;
                if (count)
                    return lazy(items).sum() / count;
                else
                    return undefined;
            }
        };
        var JsoqlQuery = (function () {
            function JsoqlQuery(stmt, namedArrays) {
                this.stmt = stmt;
                this.dataSource = namedArrays ? new ArrayDataSource(namedArrays) : new DefaultDataSource();
            }
            JsoqlQuery.prototype.DoOperation = function (operator, args) {
                var func = operators[operator.toLowerCase()];
                if (!func)
                    throw 'Unrecognized operator: ' + name;
                return func(args);
            };
            JsoqlQuery.prototype.DoAggregateFunction = function (name, items) {
                var func = aggregateFunctions[name.toLowerCase()];
                if (!func)
                    throw 'Unrecognized function: ' + name;
                return func(items);
            };
            JsoqlQuery.prototype.Evaluate = function (expression, target) {
                var _this = this;
                if (expression.Operator) {
                    var args = expression.Args.map(function (arg) { return _this.Evaluate(arg, target); });
                    return this.DoOperation(expression.Operator, args);
                }
                else if (expression.Property) {
                    var propTarget;
                    if (expression.Index != undefined) {
                        //TODO: Check index is integer and target property is array
                        propTarget = target[expression.Property][expression.Index];
                    }
                    else
                        propTarget = target[expression.Property];
                    if (expression.Child)
                        return this.Evaluate(expression.Child, propTarget);
                    else
                        return propTarget;
                }
                else if (expression.Quoted)
                    return expression.Quoted;
                else
                    return expression;
            };
            JsoqlQuery.prototype.Key = function (expression) {
                if (expression.Property) {
                    var propKey;
                    if (expression.Index != undefined) {
                        propKey = expression.Property + '[' + expression.Index + ']';
                    }
                    else
                        propKey = expression.Property;
                    if (expression.Child)
                        return propKey + '.' + this.Key(expression.Child);
                    else
                        return propKey;
                }
                else if (expression.Call) {
                    return expression.Call;
                }
                else
                    return '';
            };
            JsoqlQuery.prototype.EvaluateGroup = function (expression, group) {
                var _this = this;
                if (JsoqlQuery.IsAggregate(expression)) {
                    var items = expression.Arg ? group.Items.map(function (item) { return _this.Evaluate(expression.Arg, item); }) : group.Items;
                    return this.DoAggregateFunction(expression.Call, items);
                }
                else if (expression.Property) {
                    var key = this.Key(expression);
                    return group.Key[key];
                }
                /*if (expression.Operator) {
                    var args = expression.Args.map(arg => this.Evaluate(arg, target)[1]);
                    return ['', this.DoOperation(expression.Operator, args)];
                }
                else if (expression.Property) {
                    if (expression.Child) return this.Evaluate(expression.Child, target[expression.Property]);
                    else return [expression.Property, target[expression.Property]];
                }
                else if (expression.Quoted) return ['', expression.Quoted];
                else return ['', expression];*/
            };
            JsoqlQuery.prototype.From = function (fromClause) {
                var _this = this;
                var targets = this.CollectFromTargets(fromClause);
                var seq = this.dataSource.Get(targets[0].Target);
                if (targets.length > 1) {
                    var aliases = lazy(targets).map(function (t) { return t.Alias; });
                    //Aliases are mandatory if multiple targets are used
                    if (lazy(aliases).some(function (a) { return !a; })) {
                        throw 'Each table must have an alias if more than one table is specified';
                    }
                    if (aliases.uniq().size() < targets.length) {
                        throw 'Table aliases must be unique';
                    }
                    //Map each item to a property with the alias of its source table
                    seq = seq.map(function (item) {
                        var mapped = {};
                        mapped[targets[0].Alias] = item;
                        return mapped;
                    });
                    //Join each subsequent table
                    lazy(targets).slice(1).each(function (target) {
                        //Get sequence of items from right of join
                        var rightItems = _this.dataSource.Get(target.Target);
                        //For each item on left of join, find 0 to many matching items from the right side, using the ON expression
                        seq = seq.map(function (li) {
                            return rightItems.map(function (ri) {
                                //Create prospective merged item containing left and right side items
                                var merged = clone(li);
                                merged[target.Alias] = ri;
                                //Return non-null value to indicate match
                                if (_this.Evaluate(target.Condition, merged))
                                    return merged;
                                else
                                    return null;
                            }).compact(); //Throw away null (non-matching) values
                        }).flatten(); //Flatten the sequence of sequences
                    });
                }
                else {
                }
                return seq;
            };
            JsoqlQuery.prototype.CollectFromTargets = function (fromClauseNode) {
                //Join
                if (fromClauseNode.Left) {
                    return this.CollectFromTargets(fromClauseNode.Left).concat(this.CollectFromTargets(fromClauseNode.Right).map(function (n) {
                        n.Condition = fromClauseNode.Expression;
                        return n;
                    }));
                }
                else if (fromClauseNode.Target) {
                    //Quoted
                    if (fromClauseNode.Target.Quoted) {
                        return [{ Target: fromClauseNode.Target.Quoted, Alias: fromClauseNode.Alias }];
                    }
                    else
                        return [{ Target: fromClauseNode.Target, Alias: fromClauseNode.Alias }];
                }
                else {
                    //Quoted
                    if (fromClauseNode.Quoted) {
                        return [{ Target: fromClauseNode.Quoted, Alias: null }];
                    }
                    else {
                        return [{ Target: fromClauseNode, Alias: null }];
                    }
                }
            };
            JsoqlQuery.prototype.Execute = function () {
                var _this = this;
                //From
                var seq = this.From(this.stmt.From);
                //Where
                if (this.stmt.Where) {
                    seq = seq.filter(function (item) {
                        return _this.Evaluate(_this.stmt.Where, item);
                    });
                }
                //Grouping
                //Explicitly
                if (this.stmt.GroupBy) {
                    return this.GroupBy(seq, this.stmt.GroupBy).then(function (groups) { return groups.map(function (group) { return lazy(_this.stmt.Select).map(function (selectable) { return [
                        selectable.Alias || _this.Key(selectable.Expression),
                        _this.EvaluateGroup(selectable.Expression, group)
                    ]; }).toObject(); }).toArray(); });
                }
                else if (lazy(this.stmt.Select).some(function (selectable) { return JsoqlQuery.IsAggregate(selectable.Expression); })) {
                    return JsoqlQuery.SequenceToArray(seq).then(function (items) {
                        var group = {
                            Key: null,
                            Items: items
                        };
                        return [
                            lazy(_this.stmt.Select).map(function (selectable) { return [
                                selectable.Alias || _this.Key(selectable.Expression),
                                _this.EvaluateGroup(selectable.Expression, group)
                            ]; }).toObject()
                        ];
                    });
                }
                else {
                    //Select
                    seq = seq.map(function (item) {
                        return lazy(_this.stmt.Select).map(function (selectable) { return [
                            selectable.Alias || _this.Key(selectable.Expression),
                            _this.Evaluate(selectable.Expression, item)
                        ]; }).toObject();
                    });
                    return JsoqlQuery.SequenceToArray(seq);
                }
            };
            /*Group(): Q.Promise<JqlQuery> {
                return (<any>this.sequence
                    .toArray())
                    .then(arr => {
                        var group: Group = {
                            Items: arr
                        };
                        return new JqlQuery(lazy([group]));
                    });
            }*/
            JsoqlQuery.prototype.GroupBy = function (seq, expressions) {
                var _this = this;
                var groupKey = function (item) {
                    var object = lazy(expressions).map(function (exp) { return [_this.Key(exp), _this.Evaluate(exp, item)]; }).toObject();
                    return JSON.stringify(object);
                };
                return JsoqlQuery.SequenceToArray(seq).then(function (items) {
                    var grouped = lazy(items).groupBy(groupKey);
                    var lazyGroups = grouped.toArray();
                    var groups = lazyGroups.map(function (lg) {
                        return {
                            Key: JSON.parse(lg[0]),
                            Items: lg[1]
                        };
                    });
                    return lazy(groups);
                });
            };
            JsoqlQuery.IsAggregate = function (expression) {
                return !!expression && !!expression.Call && !!aggregateFunctions[expression.Call.toLowerCase()];
            };
            JsoqlQuery.SequenceToArray = function (seq) {
                var arrayPromise = seq.toArray();
                if (Jsoql.Utilities.IsArray(arrayPromise))
                    return Q(arrayPromise);
                else
                    return arrayPromise;
            };
            JsoqlQuery.SingleTableAlias = '*';
            return JsoqlQuery;
        })();
        Query.JsoqlQuery = JsoqlQuery;
    })(Query = Jsoql.Query || (Jsoql.Query = {}));
})(Jsoql || (Jsoql = {}));
///<reference path="Scripts/parse.ts" />
///<reference path="Scripts/query.ts" />
module.exports = Jsoql;
//# sourceMappingURL=jsoql.js.map