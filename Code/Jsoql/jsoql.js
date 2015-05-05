///<reference path="Scripts/typings/q/Q.d.ts"/>
var p = require('./Scripts/parse');
var q = require('./Scripts/query');
function ExecuteQuery(jsoql, context) {
    var statement;
    statement = p.Parse(jsoql);
    var query = new q.JsoqlQuery(statement, context);
    return query.Execute().then(function (results) {
        return { Results: results };
    });
}
exports.ExecuteQuery = ExecuteQuery;
//# sourceMappingURL=jsoql.js.map