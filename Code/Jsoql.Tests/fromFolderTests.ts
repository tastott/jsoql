///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import path = require('path');
import assert = require('assert');
import testBase = require('testBase')
var Jsoql: JsoqlStatic = require('../Jsoql/jsoql');
    

export function FromFolderDefault() {
    var query = "SELECT Order.Id AS Id FROM 'file://Data/Folder'";
    var expected = [
        { Id: 11074 },
        { Id: 11075 },
        { Id: 11076 }
    ];
    testBase.ExecuteAndAssertDeepEqual(query, {}, expected);
}

export function FromFolderDefaultWithFilenameProperty() {
    var query = "SELECT Order.Id AS Id, @@Filename AS Filename FROM 'file://Data/Folder'";
    var expected = [
        { Id: 11074, Filename: 'TODO' },
        { Id: 11075, Filename: 'TODO' },
        { Id: 11076, Filename: 'TODO' }
    ];
    testBase.ExecuteAndAssertDeepEqual(query, {}, expected);
}

export function FromFolderWithRecursion() {
    var query = "SELECT Order.Id AS Id FROM 'file://Data/Folder?recurse=true'";
    var expected = [
        { Id: 11074 },
        { Id: 11075 },
        { Id: 11076 },
        { Id: 11077 }
    ];
    testBase.ExecuteAndAssertDeepEqual(query, {}, expected);
}

export function FromFolderWithPattern() {
    var query = "SELECT Order.Id AS Id FROM 'file://Data/Folder?pattern=*.blah'";
    var expected = [
        { Id: 11074 },
        { Id: 11075 }
    ];
    testBase.ExecuteAndAssertDeepEqual(query, {}, expected);
}
