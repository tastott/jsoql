///<reference path="Scripts/typings/q/Q.d.ts"/>
var Q = require('q');
var p = require('./Scripts/parse');
var q = require('./Scripts/query');
function ExecuteQuery(jsoql, context) {
    try {
        var statement;
        statement = p.Parse(jsoql);
        var query = new q.JsoqlQuery(statement, context);
        return query.Execute().then(function (results) {
            return { Results: results };
        });
    }
    catch (ex) {
        var result = {
            Errors: [ex]
        };
        return Q(result);
    }
}
exports.ExecuteQuery = ExecuteQuery;
//# sourceMappingURL=jsoql.js.map