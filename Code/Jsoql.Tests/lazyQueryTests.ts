import assert = require('assert');
import testBase = require('./testBase')

export function CompletedLazyQueryHasAllItems() {

    var query = "SELECT * FROM 'file://Data/customers.jsonl'";

    return testBase.ExecuteLazyToCompletionAndAssert(query, exec => {
        assert.equal(exec.Iterator.AvailableItems(), 91);
    });

}