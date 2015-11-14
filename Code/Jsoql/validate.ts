//SELECT Thing.*.Something  - Child of star
//(SELECT A, B FROM Blah) - Multiple fields in sub-query
var lazy : LazyJS.LazyStatic = require('./Hacks/lazy.js')
import p = require('./parse')
import m = require('./models')

interface ErrorCondition<T> {
    (target: T) : string;
}

export function Validate(statement: m.Statement): any[] {

    var selectableErrors : ErrorCondition<m.Selectable>[] = [
        // s => s.Expression.SubQuery && s.Expression.SubQuery.Select.SelectList.length > 1
        //         ? 'Sub-query in SELECT clause can only have column'
        //         : null
    ];

    return lazy(selectableErrors)
        .map(e => statement.Select.SelectList.map(s => e(s)))
        .flatten()
        .filter(e => !!e)
        .toArray();
}