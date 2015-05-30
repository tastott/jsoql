var lazy: LazyJS.LazyStatic = require('./Hacks/lazy.node')
import Q = require('q')
import ds = require('./datasource')
import parse = require('./parse')
import m = require('./models')
import qstring = require('./query-string')
import util = require('./utilities')
import query = require('./query')
var clone = require('clone')
      


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
    'or': args => args[0] || args[1],
    '+': args => args[0] + args[1]
};

var scalarFunctions: FunctionMappings = {
    'regexmatch': args => {
        if (args[0] && typeof args[0] === 'string') {
            var match = (<string>args[0]).match(new RegExp(args[1], args[2] || ''));
            if (match) return match[0];
            else return null;
        }
        else return null;
    },
    'length': args => {
        if (args[0] && typeof args[0] === 'string') {
            return (<string>args[0]).length;
        }
        else return null;
    }
}

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

export class Evaluator {
    constructor(private datasources: ds.DataSourceSequencers = null) { }

    public Evaluate(expression: any, target: any) {
        if (expression.Operator) {
            var args = expression.Args.map(arg => this.Evaluate(arg, target));
            return this.DoOperation(expression.Operator, args);
        }
        else if (expression.Property) {
            var propTarget;

            if (target[expression.Property] == undefined) return undefined;

            if (expression.Index != undefined) {
                //TODO: Check index is integer and target property is array
                propTarget = target[expression.Property][expression.Index];
            } else propTarget = target[expression.Property];

            if (expression.Child) return this.Evaluate(expression.Child, propTarget);
            else return propTarget;
        }
        else if (expression.Quoted) return expression.Quoted;
        else if (expression.Call) {
            var args = expression.Args.map(arg => this.Evaluate(arg, target));
            return this.DoScalarFunction(expression.Call, args);
        }
        else if (expression.KeyValues) {
            var keyValues: { Key: string; Value: any }[] = expression.KeyValues;
            return lazy(keyValues)
                .map(kv => [kv.Key, this.Evaluate(kv.Value, target)])
                .toObject();
        }
        else if (expression.SubQuery) {
            var context: m.QueryContext = {
                Data: target
            };
            var subquery = new query.JsoqlQuery(expression.SubQuery, this.datasources, context);
            var results = subquery.ExecuteSync();

            return util.MonoProp(results[0]);
        }
        else return expression;
    }

    static Evaluate(expression: any, target: any) {
        return new Evaluator().Evaluate(expression, target);
    }

    public EvaluateAliased(expression: any, target: any, alias?: string): { Alias: string; Value: any }[] {
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
            var propAlias = expression.Index != undefined
                ? aliasPrefix + expression.Property + '[' + expression.Index + ']'
                : propAlias = aliasPrefix + expression.Property;

            //TODO: Check index is integer and target property is array
            var propTarget = target != undefined
                ? expression.Index != undefined
                    ? propTarget = target[expression.Property][expression.Index]
                    : propTarget = target[expression.Property]
                : undefined; //Keep passing 'undefineds' down to get full alias
           

            if (expression.Child) return this.EvaluateAliased(expression.Child, propTarget, propAlias);
            else return [{ Alias: propAlias, Value: propTarget }];
        }
        else if (expression.Quoted) return [{ Alias: expression.Quoted, Value: expression.Quoted }];
        else if (expression.SubQuery) {
            var context: m.QueryContext = {
                Data: target
            };
            var subquery = new query.JsoqlQuery(expression.SubQuery, this.datasources, context);

            //A variable datasource for the sub-query can legitimately not exist (i.e. this item doesn't have the referenced property)
            //To cater for this, we have to check for such a datasource now and return a null value
            var variableDatasources = subquery.GetDatasources().filter(ds => ds.Type === 'var');
            if (variableDatasources.some(vds => {
                return !this.Evaluate(vds.Value, target);
            })) return [{ Alias: alias, Value: null }]
            else {
                var results = subquery.ExecuteSync();

                return [{ Alias: alias, Value: util.MonoProp(results[0]) }];
            }
        }
        else if (expression.Call) {
            var args = expression.Args.map(arg => this.Evaluate(arg, target));
            return [{ Alias: '', Value: this.DoScalarFunction(expression.Call, args) }];
        }
        else if (expression.KeyValues) {
            var keyValues: { Key: string; Value: any }[] = expression.KeyValues;
            return [{
                Alias: alias,
                Value: lazy(keyValues)
                    .map(kv => [kv.Key, this.Evaluate(kv.Value, target)])
                    .toObject()
            }];
        }
        else return [{ Alias: '', Value: expression }];
    }

    public EvaluateGroup(expression: any, group: m.Group) {
        if (Evaluator.IsAggregate(expression)) {
            if (expression.Args && expression.Args.length > 1)
                throw new Error('Aggregate function expected zero or one arguments');

            var items = expression.Args[0]
                ? group.Items.map(item => this.Evaluate(expression.Args[0], item))
                : group.Items;

            return this.DoAggregateFunction(expression.Call, items);
        }
        else if (expression.Property) {
            var key = Evaluator.Key(expression);
            return group.Key[key];
        }
        else if (expression.Call) {
            var args = expression.Args.map(arg => this.EvaluateGroup(arg, group));
            return this.DoScalarFunction(expression.Call, args);
        }
        else if (expression.Operator) {
            var args = expression.Args.map(arg => this.EvaluateGroup(arg, group));
            return this.DoOperation(expression.Operator, args);
        }
        else if (expression.KeyValues) {
            var keyValues: { Key: string; Value: any }[] = expression.KeyValues;
            return lazy(keyValues)
                .map(kv => [kv.Key, this.EvaluateGroup(kv.Value, group)])
                .toObject();
        }
        else if (expression.Quoted) return expression.Quoted;
        else return expression;
    }

    private DoScalarFunction(name: string, args: any[]) {

        var func = scalarFunctions[name.toLowerCase()];

        if (!func) throw 'Unrecognized function: ' + name;

        return func(args);
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

    static IsAggregate(expression: any): boolean {
        return !!expression
            && !!expression.Call
            && !!aggregateFunctions[expression.Call.toLowerCase()];
    }

    static Key(expression: any): string {
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

}
