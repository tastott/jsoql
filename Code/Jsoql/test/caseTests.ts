///<reference path="../typings/mocha/mocha.d.ts" /> 
import testBase = require('./testBase')

var data = [
    { Name: 'Banana', IsTasty: true },
    { Name: 'Tomato', IsTasty: true },
    { Name: 'Mustard', IsTasty: false }
];


describe('caseTests', () => {
    it('CaseExpressionWhenWithNoElse', () => {

        var query =
            "SELECT \
            Name, \
            CASE Name \
                WHEN 'Banana' THEN 'Yellow' \
                WHEN 'Tomato' THEN 'Red' \
                WHEN 'Mustard' THEN 'Yellow' \
            END AS Colour\
        FROM 'var://Test'";

        var expected = [
            { Name: 'Banana', Colour: 'Yellow' },
            { Name: 'Tomato', Colour: 'Red' },
            { Name: 'Mustard', Colour: 'Yellow' }
        ];

        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })

    it('CaseExpressionWhenWithElse', () => {

        var query =
            "SELECT \
            Name, \
            CASE Name \
                WHEN 'Tomato' THEN 'Red' \
                ELSE 'Yellow' \
            END AS Colour\
        FROM 'var://Test'";

        var expected = [
            { Name: 'Banana', Colour: 'Yellow' },
            { Name: 'Tomato', Colour: 'Red' },
            { Name: 'Mustard', Colour: 'Yellow' }
        ];

        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })

    it('CaseWhenWithNoElse', () => {

        var query =
            "SELECT \
            Name, \
            CASE \
                WHEN IsTasty = true THEN 'Yum, this ' + Name  + ' is nice!' \
                WHEN IsTasty = false THEN 'Bleurk! I hate ' + Name + '!' \
            END AS Comment\
        FROM 'var://Test'";

        var expected = [
            { Name: 'Banana', Comment: 'Yum, this Banana is nice!' },
            { Name: 'Tomato', Comment: 'Yum, this Tomato is nice!' },
            { Name: 'Mustard', Comment: 'Bleurk! I hate Mustard!' }
        ];

        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })

    it('CaseWhenWithElse', () => {

        var query =
            "SELECT \
            Name, \
            CASE \
                WHEN IsTasty = true THEN 'Yum, this ' + Name + ' is nice!' \
                ELSE 'Bleurk! I hate ' + Name + '!' \
            END AS Comment\
        FROM 'var://Test'";

        var expected = [
            { Name: 'Banana', Comment: 'Yum, this Banana is nice!' },
            { Name: 'Tomato', Comment: 'Yum, this Tomato is nice!' },
            { Name: 'Mustard', Comment: 'Bleurk! I hate Mustard!' }
        ];

        return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
    })
})