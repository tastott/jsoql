import assert = require('assert');
import testBase = require('./testBase');

var data = [
    {
        "message": "Ullamco cillum cupidatat exercitation voluptate enim aliquip in magna ea adipisicing nulla laboris.",
        "date": "1920-05-04T00:30:38-01:00"
    },
    {
        "message": "Magna ex exercitation duis qui velit.",
        "date": "1977-05-02T13:09:29-01:00"
    },
    {
        "message": "Laborum amet cupidatat labore laborum fugiat in sit.",
        "date": "2002-06-12T10:12:40-01:00"
    },
    {
        "message": "Ullamco quis magna eu aliquip dolor in excepteur nisi Lorem magna cupidatat consequat magna exercitation.",
        "date": "1919-07-26T13:34:54-01:00"
    }
];

export function DatePartYear() {

    var query = "SELECT DATEPART('year', date) AS Blah FROM 'var://Test'";
    
    var expected = [
        { Blah: 1920},
        { Blah: 1977 },
        { Blah: 2002 },
        { Blah: 1919 }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function DatePartMonth() {
    var query = "SELECT DATEPART('month', date) AS Blah FROM 'var://Test'";

    var expected = [
        { Blah: 5 },
        { Blah: 5},
        { Blah: 6 },
        { Blah: 7 }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function DatePartDay() {
    var query = "SELECT DATEPART('day', date) AS Blah FROM 'var://Test'";

    var expected = [
        { Blah: 4 },
        { Blah: 2 },
        { Blah: 12 },
        { Blah: 26 }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function DatePartHour() {

    var query = "SELECT DATEPART('hour', date) AS Blah FROM 'var://Test'";

    //UTC hour
    var expected = [
        { Blah: 1 },
        { Blah: 14},
        { Blah: 11 },
        { Blah: 14 }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function DatePartMinute() {

    var query = "SELECT DATEPART('minute', date) AS Blah FROM 'var://Test'";

    var expected = [
        { Blah: 30 },
        { Blah: 9 },
        { Blah: 12 },
        { Blah: 34 }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}


export function DatePartSecond() {

    var query = "SELECT DATEPART('second', date) AS Blah FROM 'var://Test'";

    var expected = [
        { Blah: 38 },
        { Blah: 29 },
        { Blah: 40 },
        { Blah: 54 }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}

export function DatePartPreservesTimeOffsetFromSourceIfThirdArgumentIsTrue() {

    var data = [
        {
            date: '2015-12-31T23:59:59-01:00'
        }
    ];
    var query = "SELECT DATEPART('year', date, true) AS Year,  DATEPART('month', date, true) AS Month,  DATEPART('day', date, true) AS Day,  DATEPART('hour', date, true) AS Hour FROM 'var://Test'";

    var expected = [
        {
            Year: 2015,
            Month: 12,
            Day: 31,
            Hour: 23
        }
    ];

    return testBase.ExecuteAndAssertDeepEqual(query, data, expected);
}


