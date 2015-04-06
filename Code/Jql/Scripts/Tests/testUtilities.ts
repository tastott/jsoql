import qry = require('../query')
import parse = require('../parse')
import Q = require('q')

export function ExecuteArrayQuery(jql: string, values: any[]): Q.Promise<any[]> {
    var stmt = parse.Parse(jql);
 
    return Q([]);
    
    //var data = new qry.ArrayDataSource(values);
    //var query = new qry.JqlQuery(stmt, data);
    //return query.Execute();
}