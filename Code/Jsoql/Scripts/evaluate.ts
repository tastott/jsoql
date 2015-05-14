import lazy = require('lazy.js')
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

export function Evaluate(expression: any, target: any) {
    if (expression.Operator) {
        var args = expression.Args.map(arg => Evaluate(arg, target));
        return DoOperation(expression.Operator, args);
    }
    else if (expression.Property) {
        var propTarget;

        if (target[expression.Property] == undefined) return undefined;

        if (expression.Index != undefined) {
            //TODO: Check index is integer and target property is array
            propTarget = target[expression.Property][expression.Index];
        } else propTarget = target[expression.Property];

        if (expression.Child) return Evaluate(expression.Child, propTarget);
        else return propTarget;
    }
    else if (expression.Quoted) return expression.Quoted;
    else return expression;
}

export function EvaluateAliased(expression: any, target: any, alias ?: string): { Alias: string; Value: any } []{
    if (expression.Operator) {
        var args = expression.Args.map(arg => Evaluate(arg, target));
        return [{ Alias: '', Value: DoOperation(expression.Operator, args) }];
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
            :  propAlias = aliasPrefix + expression.Property;

         //TODO: Check index is integer and target property is array
        var propTarget = target != undefined
            ? expression.Index != undefined
                ? propTarget = target[expression.Property][expression.Index]
                : propTarget = target[expression.Property]
            : undefined; //Keep passing 'undefineds' down to get full alias
           

        if (expression.Child) return EvaluateAliased(expression.Child, propTarget, propAlias);
        else return [{ Alias: propAlias, Value: propTarget }];
    }
    else if (expression.Quoted) return [{ Alias: expression.Quoted, Value: expression.Quoted }];
    else if (expression.SubQuery) {
        var context: m.QueryContext = {
            Data: target
        };
        var subquery = new query.JsoqlQuery(expression.SubQuery, context);
        var results = subquery.ExecuteSync();

        return [{ Alias: alias, Value: util.MonoProp(results[0]) }];
    }
    else return [{ Alias: '', Value: expression }];
}

export function EvaluateGroup(expression: any, group: m.Group) {
    if (IsAggregate(expression)) {
        var items = expression.Arg
            ? group.Items.map(item => Evaluate(expression.Arg, item))
            : group.Items;

        return DoAggregateFunction(expression.Call, items);
    }
    else if (expression.Property) {
        var key = Key(expression);
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

function DoOperation(operator: string, args: any[]) {
    var func = operators[operator.toLowerCase()];

    if (!func) throw 'Unrecognized operator: ' + name;

    return func(args);
}

function DoAggregateFunction(name: string, items: any[]) {

    var func = aggregateFunctions[name.toLowerCase()];

    if (!func) throw 'Unrecognized function: ' + name;

    return func(items);
}

export function IsAggregate(expression: any): boolean {
    return !!expression
        && !!expression.Call
        && !!aggregateFunctions[expression.Call.toLowerCase()];
}


export function Key(expression: any): string {
    if (expression.Property) {
        var propKey;
        if (expression.Index != undefined) {
            propKey = expression.Property + '[' + expression.Index + ']';
        } else propKey = expression.Property

        if (expression.Child) return propKey + '.' + Key(expression.Child);
        else return propKey;
    }
    else if (expression.Call) {
        return expression.Call;
    }
    else return '';
}