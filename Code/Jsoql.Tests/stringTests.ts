///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import assert = require('assert');
import testBase = require('./testBase');

//Have to assert inside setTimeout to get the async test to work
//https://nodejstools.codeplex.com/discussions/550545

export function SelectRegexMatch() {
    var data = [
        { Value: 'John is 46 years old' },
        { Value: 'Dan is 9 years old' },
        { Value: 'Jane is 86 years old' }
    ];
    var query = "SELECT REGEXMATCH(Value, '[0-9]+(?= years old)') AS Age FROM 'var://Test'";
    var expected = [
        { Age: '46' },
        { Age: '9' },
        { Age: '86' }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function SelectRegexMatchWithOptions() {
    var data = [
        { Value: 'I love Regex' },
        { Value: 'I LOVE Regex' },
        { Value: 'i love RegEx' }
    ];
    var query = "SELECT REGEXMATCH(Value, 'I love Regex', 'i') AS Value FROM 'var://Test'";


    return testBase.ExecuteAndAssertDeepEqual(query, data, data);
}

export function WhereRegexMatch() {
    var data = [
        { Value: 'John is 46 years old' },
        { Value: 'Dan is 9 years old' },
        { Value: 'Jane is 86 years old' }
    ];
    var query = "SELECT Value FROM 'var://Test' WHERE REGEXMATCH(Value, '[0-9]6 years old')";
    var expected = [
        { Value: 'John is 46 years old' },
        { Value: 'Jane is 86 years old' }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}