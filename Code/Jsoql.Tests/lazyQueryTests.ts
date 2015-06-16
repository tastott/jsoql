import assert = require('assert');
import testBase = require('./testBase')
import jsoql = require('jsoql')

var jsoqlEngine = new jsoql.DesktopJsoqlEngine();

export function CompletedLazyQueryHasAllItems() {

    var query = "SELECT * FROM 'file://Data/customers.jsonl'";

    return testBase.ExecuteLazyToCompletionAndAssert(query, exec => {
        assert.equal(exec.Iterator.AvailableItems(), 91);
    });

}

export function GetNextGetsAllRemainingItemsIfQueryIsComplete() {

    var query = "SELECT TOP 5 * FROM 'file://Data/orders.json'";

  
    return jsoqlEngine.ExecuteQuery(query)
        .Iterator
        .GetNext(8)
        .then(results => {
            setTimeout(() => assert.equal(results.length, 5));
        })
        .fail(error => {
            setTimeout(() => assert.fail(null, null, error));
        });
   

}