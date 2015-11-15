//SELECT Thing.*.Something  - Child of star
//(SELECT PROMOTE A, B FROM Blah) - Multiple fields in PROMOTEd query
//(SELECT PROMOTE * FROM Blah) - PROMOTEd star query
var lazy : LazyJS.LazyStatic = require('./Hacks/lazy.js')
import p = require('./parse')
import m = require('./models')
var deepEquals = require('deep-equal')

interface ErrorCondition<T> {
    (target: T) : string;
}

export function Validate(statement: m.Statement): any[] {

    var columnErrors = lazy(statement.Select.SelectList)
        .map(c => ValidateColumn(c))
        .flatten();

    var queryErrorConditions: ErrorCondition<m.Statement>[] = [
        q => q.Select.Promote && q.Select.SelectList.length > 1
            ? 'SELECT clause using PROMOTE can only have one column'
            : null,
        
        q => q.Select.Promote && q.Select.SelectList.some(column => deepEquals(column.Expression, {Property: '*'}))
            ? "SELECT clause using PROMOTE cannot contain '*'"
            : null
    ];
    
    return lazy(queryErrorConditions)
        .map(e => e(statement))
        .filter(e => !!e)
        .concat(<any>columnErrors.toArray())
        .toArray();
}

export function ValidateColumn(column: m.Selectable): string[] {
    var columnErrors : ErrorCondition<m.Selectable>[] = [
        // s => s.Expression.SubQuery && s.Expression.SubQuery.Select.SelectList.length > 1
        //         ? 'Sub-query in SELECT clause can only have column'
        //         : null
    ];
    
    return lazy(columnErrors)
        .map(e => e(column))
        .filter(e => !!e)
        .toArray();
}