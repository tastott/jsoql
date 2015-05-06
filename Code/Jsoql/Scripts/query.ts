import lazy = require('lazy.js')
import Q = require('q')
import ds = require('./datasource')
import parse = require('./parse')
import m = require('./models')
import qstring = require('./query-string')
import util = require('./utilities')
var clone = require('clone')
      

interface Group {
    Key: any;
    Items: any[];
}

        

interface FunctionMappings {
    [key: string]: (items: any[]) => any;
}

var operators: FunctionMappings = {
    '=': args => args[0] == args[1],
    '!=': args => args[0] !== args[1],
    '>': args => args[0] > args[1],
    '>=': args => args[0] >= args[1],
    '<': args => args[0] < args[1],
    '<=': args => args[0] <= args[1],
    'and': args => args[0] && args[1],
    'or': args => args[0] || args[1]
};

var aggregateFunctions: FunctionMappings = {
    'count': items => items.length,
    'max': items => lazy(items).max(),
    'min': items => lazy(items).min(),
    'sum': items => lazy(items).sum(),
    'avg': items => {
        var count = items.length;
        if (count) return lazy(items).sum() / count;
        else return undefined;
    }
};

     

export class JsoqlQuery {

    private queryContext: m.QueryContext
    private static dataSources: { [scheme: string]: ds.DataSource } = {
        "var": new ds.VariableDataSource(),
        "file": new ds.SmartFileDataSource()
    };

    constructor(private stmt: parse.Statement,
        queryContext?: m.QueryContext) {
        queryContext = queryContext || {};

        this.queryContext = {
            BaseDirectory: queryContext.BaseDirectory || process.cwd(),
            Data: queryContext.Data || {}
        };
        //this.queryContext = extend(queryContext,
        //    {
        //        BaseDirectory: process.cwd(),
        //        Data: {}
        //    });

    }

    private DoOperation(operator: string, args: any[]) {
        var func = operators[operator.toLowerCase()];

        if (!func) throw 'Unrecognized operator: ' + name;

        return func(args);
    }

    private DoAggregateFunction(name: string, items: any[]) {

        var func = aggregateFunctions[name.toLowerCase()];

        if (!func) throw 'Unrecognized function: ' + name;

        return func(items);
    }

    private EvaluateAliased(expression: any, target: any, alias?: string): { Alias: string; Value: any }[]{
        if (expression.Operator) {
            var args = expression.Args.map(arg => this.Evaluate(arg, target));
            return [{ Alias: '', Value: this.DoOperation(expression.Operator, args) }];
        }
        else if (expression.Property == '*') {
            if (!target) return [];
            else return Object.keys(target)
                .map(key => {
                    return {
                        Alias: key,
                        Value: target[key]
                    };
                });
        }
        else if (expression.Property) {
            var aliasPrefix = alias ? alias + '.' : '';
            var propTarget, propAlias;
            if (expression.Index != undefined) {
                //TODO: Check index is integer and target property is array
                propTarget = target[expression.Property][expression.Index];
                propAlias = aliasPrefix + expression.Property + '[' + expression.Index + ']';
            } else {
                propTarget = target[expression.Property];
                propAlias = aliasPrefix + expression.Property
            }

            if (expression.Child) return this.EvaluateAliased(expression.Child, propTarget, propAlias);
            else return [{ Alias: propAlias, Value: propTarget }];
        }
        else if (expression.Quoted) return [{ Alias: expression.Quoted, Value: expression.Quoted }];
        else if (expression.SubQuery) {
            var context: m.QueryContext = {
                Data: target
            };
            var subquery = new JsoqlQuery(expression.SubQuery, context);
            var results = subquery.ExecuteSync();

            return [{ Alias: alias, Value: util.MonoProp(results[0]) }];
        }
        else return [{ Alias: '', Value: expression }];
    }

    private Evaluate(expression: any, target: any) {
        if (expression.Operator) {
            var args = expression.Args.map(arg => this.Evaluate(arg, target));
            return this.DoOperation(expression.Operator, args);
        }
        else if (expression.Property) {
            var propTarget;
            if (expression.Index != undefined) {
                //TODO: Check index is integer and target property is array
                propTarget = target[expression.Property][expression.Index];
            } else propTarget = target[expression.Property];

            if (expression.Child) return this.Evaluate(expression.Child, propTarget);
            else return propTarget;
        }
        else if (expression.Quoted) return expression.Quoted;
        else return expression;
    }

    private Key(expression: any): string {
        if (expression.Property) {
            var propKey;
            if (expression.Index != undefined) {
                propKey = expression.Property + '[' + expression.Index + ']';
            } else propKey = expression.Property

            if (expression.Child) return propKey + '.' + this.Key(expression.Child);
            else return propKey;
        }
        else if (expression.Call) {
            return expression.Call;
        }
        else return '';
    }

    private EvaluateGroup(expression: any, group: Group) {
        if (JsoqlQuery.IsAggregate(expression)) {
            var items = expression.Arg
                ? group.Items.map(item => this.Evaluate(expression.Arg, item))
                : group.Items;

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
    }

    private GetSequence(target: string): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        var fromTargetRegex = new RegExp('^([A-Za-z]+)://([^?]+)(?:\\?(.+))?$', 'i');
        var match = target.match(fromTargetRegex);

        if (!match) {
            return JsoqlQuery.dataSources['var'].Get(target, {}, this.queryContext);
        }
        else {
            var scheme = match[1].toLowerCase();
            var parameters = match[3] ? qstring.Parse(match[3]) : {};
            var dataSource = JsoqlQuery.dataSources[scheme];
            if (!dataSource) throw new Error("Invalid scheme for from clause target: '" + scheme + "'");

            return dataSource.Get(match[2], parameters, this.queryContext);
        } 
    }

    private From(fromClause: any): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        var targets = this.CollectFromTargets(fromClause);

        var seq = this.GetSequence(targets[0].Target);

        if (targets.length > 1) {
            var aliases = lazy(targets).map(t => t.Alias);

            //Aliases are mandatory if multiple targets are used
            if (lazy(aliases).some(a => !a)) {
                throw 'Each table must have an alias if more than one table is specified';
            }
            if (aliases.uniq().size() < targets.length) {
                throw 'Table aliases must be unique';
            }

            //Map each item to a property with the alias of its source table
            seq = seq.map(item => {
                var mapped = {};
                mapped[targets[0].Alias] = item;
                return mapped;
            });

            //Join each subsequent table
            lazy(targets).slice(1).each(target => {

                //Get sequence of items from right of join
                var rightItems = this.GetSequence(target.Target);

                //For each item on left of join, find 0 to many matching items from the right side, using the ON expression
                seq = seq.map(li => {
                    return rightItems.map(ri => {
                        //Create prospective merged item containing left and right side items
                        var merged = clone(li);
                        merged[target.Alias] = ri;

                        //Return non-null value to indicate match
                        if (this.Evaluate(target.Condition, merged)) return merged;
                        else return null;
                    })
                        .compact() //Throw away null (non-matching) values
                })
                    .flatten(); //Flatten the sequence of sequences
            });
        }
        else {
            //No need to do any mapping
        }

        return seq;
    }

    private CollectFromTargets(fromClauseNode: any): { Target: string; Alias: string; Condition?: any }[] {

        //Join
        if (fromClauseNode.Left) {
            return this.CollectFromTargets(fromClauseNode.Left)
                .concat(this.CollectFromTargets(fromClauseNode.Right)
                .map(n => {
                n.Condition = fromClauseNode.Expression;
                return n;
            })
                );
        }
        //Aliased
        else if (fromClauseNode.Target) {
            //Quoted
            if (fromClauseNode.Target.Quoted) {
                return [{ Target: fromClauseNode.Target.Quoted, Alias: fromClauseNode.Alias }];
            }
            //Unquoted
            else return [{ Target: fromClauseNode.Target, Alias: fromClauseNode.Alias }];
        }
        //Un-aliased
        else {
            //Quoted
            if (fromClauseNode.Quoted) {
                return [{ Target: fromClauseNode.Quoted, Alias: null }];
            }
            //Un-quoted
            else {
                return [{ Target: fromClauseNode, Alias: null }];
            }
        }

    }

    private Where(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>, whereClause : any): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>{
        return seq.filter(item => {
            return this.Evaluate(this.stmt.FromWhere.Where, item);
        })
    }

    private SelectGrouped(groups: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>): LazyJS.Sequence<any>|LazyJS.AsyncSequence <any>{
        (this.stmt.OrderBy || []).forEach(orderByExp => {
            groups = groups.sortBy(group => this.EvaluateGroup(orderByExp.Expression, group), !orderByExp.Asc);
        });

        return groups.map(group =>
            lazy(this.stmt.Select.SelectList)
                .map(selectable => [
                selectable.Alias || this.Key(selectable.Expression),
                this.EvaluateGroup(selectable.Expression, group)
            ])
                .toObject()
            )
            .first(this.stmt.Select.Limit || Number.MAX_VALUE);
    }
    private SelectMonoGroup(items : any[]): any[] {
        
        var group: Group = {
            Key: null,
            Items: items
        };

        return [
            lazy(this.stmt.Select.SelectList)
                .map(selectable => [
                selectable.Alias || this.Key(selectable.Expression),
                this.EvaluateGroup(selectable.Expression, group)
            ])
            .toObject()
        ];
    }

    private SelectUngrouped(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>): LazyJS.Sequence<any>|LazyJS.AsyncSequence <any>{
        (this.stmt.OrderBy || []).forEach(orderByExp => {
            seq = seq.sortBy(item => this.Evaluate(orderByExp.Expression, item), !orderByExp.Asc);
        });

        //Select
        return seq
            .first(this.stmt.Select.Limit || Number.MAX_VALUE)
            .map(item => {
            return lazy(this.stmt.Select.SelectList)
                .map(selectable =>
                this.EvaluateAliased(selectable.Expression, item)
                    .map(aliasValue => {
                    return {
                        Alias: selectable.Alias || aliasValue.Alias,
                        Value: aliasValue.Value
                    };
                })
                )
                .flatten()
                .map((aliasValue: any) => [aliasValue.Alias, aliasValue.Value])
                .toObject();
        });
    }


    ExecuteSync(): any[]{
        //From
        var seq = this.From(this.stmt.FromWhere.From);

        //Where
        if (this.stmt.FromWhere.Where) seq = this.Where(seq, this.stmt.FromWhere.Where);

        //Grouping
        //Explicitly
        if (this.stmt.GroupBy) {
            seq = this.GroupBySync(seq, this.stmt.GroupBy)
            seq = this.SelectGrouped(seq);
            return JsoqlQuery.SequenceToArraySync(seq);
        }
        //Implicitly
        else if (lazy(this.stmt.Select.SelectList).some(selectable => JsoqlQuery.IsAggregate(selectable.Expression))) {

            var items = JsoqlQuery.SequenceToArraySync(seq);
            return this.SelectMonoGroup(items);
        }
        //No grouping
        else {
            return JsoqlQuery.SequenceToArraySync(this.SelectUngrouped(seq));
        }
    }

    Execute(): Q.Promise<any[]> {
        
        //From
        var seq = this.From(this.stmt.FromWhere.From);

        //Where
        if (this.stmt.FromWhere.Where) seq = this.Where(seq, this.stmt.FromWhere.Where);

        //Grouping
        //Explicitly
        if (this.stmt.GroupBy) {
            return this.GroupBy(seq, this.stmt.GroupBy)
                .then(groups => this.SelectGrouped(groups))
                .then(resultSeq => resultSeq.toArray());
        }
        //Implicitly
        else if (lazy(this.stmt.Select.SelectList).some(selectable => JsoqlQuery.IsAggregate(selectable.Expression))) {

            return JsoqlQuery.SequenceToArray(seq)
                .then(items => this.SelectMonoGroup(items));
        }
        //No grouping
        else {
            return JsoqlQuery.SequenceToArray(this.SelectUngrouped(seq));
        }
    }

    private GroupBySync(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>, expressions: any[]): LazyJS.Sequence<Group> {
        var groupKey = (item: any) => {
            var object = lazy(expressions)
                .map(exp => [this.Key(exp), this.Evaluate(exp, item)])
                .toObject();

            return JSON.stringify(object);
        };

        var items = JsoqlQuery.SequenceToArraySync(seq);
          
        var grouped = lazy(items).groupBy(groupKey);
        var lazyGroups = grouped.toArray();
        var groups: Group[] = lazyGroups.map(lg => {
            return {
                Key: JSON.parse(lg[0]),
                Items: lg[1]
            };
        });

        return lazy(groups);
    }

    private GroupBy(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>, expressions: any[]): Q.Promise<LazyJS.Sequence<Group>> {
        var groupKey = (item: any) => {
            var object = lazy(expressions)
                .map(exp => [this.Key(exp), this.Evaluate(exp, item)])
                .toObject();

            return JSON.stringify(object);
        };

        return JsoqlQuery.SequenceToArray(seq)
            .then(items => {
            var grouped = lazy(items).groupBy(groupKey);
            var lazyGroups = grouped.toArray();
            var groups: Group[] = lazyGroups.map(lg => {
                return {
                    Key: JSON.parse(lg[0]),
                    Items: lg[1]
                };
            });

            return lazy(groups);
        });
    }

    private static IsAggregate(expression: any): boolean {
        return !!expression
            && !!expression.Call
            && !!aggregateFunctions[expression.Call.toLowerCase()];
    }

    private static SequenceToArraySync<T>(seq: LazyJS.Sequence<T>|LazyJS.AsyncSequence<any>): T[] {
        var arrayPromise: any = seq.toArray();

        if (util.IsArray(arrayPromise)) return arrayPromise;
        else {
            throw new Error('Sequence is asynchronous');
        }
    }

    private static SequenceToArray<T>(seq: LazyJS.Sequence<T>|LazyJS.AsyncSequence<any>): Q.Promise<T[]> {
        var arrayPromise: any = seq.toArray();

        if (util.IsArray(arrayPromise)) return Q(arrayPromise);
        else {
            var deferred = Q.defer<T[]>();

            arrayPromise.then(
                result => deferred.resolve(result),
                error => deferred.reject(error)
            );

            return deferred.promise;
        }
    }
}
