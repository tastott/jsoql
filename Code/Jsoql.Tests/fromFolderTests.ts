///<reference path="Scripts/typings/jsoql/jsoql.d.ts"/>

import fs = require('fs')
import path = require('path');
import assert = require('assert');
import testBase = require('./testBase')

    
export function FromFolderDefault() {
    var query = "SELECT Order.Id AS Id FROM 'file://Data/Folder'";
    var expected = [
        { Id: 11074 },
        { Id: 11075 },
        { Id: 11076 }
    ];
    testBase.ExecuteAndAssertDeepEqual(query, {}, expected);
}

export function FromFolderDefaultWithFileInfo() {
    var query = "SELECT @@File.name AS Filename, @@File.path AS Filepath, @@File.modifiedDate AS ModifiedDate, @@File.createdDate AS CreatedDate FROM 'file://Data/Folder'";
    
    var datePattern = /2[0-9]{3}-[01][0-9]-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z/; 
    return testBase.ExecuteAndAssertItems(query, {}, results => {
        assert.equal(results.length, 3);
        results.forEach(item => {
            assert.ok(fs.existsSync(item.Filepath), `Filepath not valid: ${item.Filepath}`);
            assert.equal(item.Filename, path.basename(item.Filepath));
            assert.ok(item.ModifiedDate && item.ModifiedDate.match(datePattern), `Modified date not valid: ${item.ModifiedDate}`);
            assert.ok(item.CreatedDate && item.CreatedDate.match(datePattern), `Created date not valid: ${item.CreatedDate}`);
        });
    });
}

export function FromFolderWithRecursion() {
    var query = "SELECT Order.Id AS Id FROM {uri: 'file://Data/Folder', recurse: true } ORDER BY Order.Id";
    var expected = [
        { Id: 11074 },
        { Id: 11075 },
        { Id: 11076 },
        { Id: 11077 }
    ];
    testBase.ExecuteAndAssertDeepEqual(query, {}, expected);
}

export function FromFolderWithPattern() {
    var query = "SELECT Order.Id AS Id FROM {uri: 'file://Data/Folder', pattern:'*.blah'}";
    var expected = [
        { Id: 11074 },
        { Id: 11075 }
    ];
    testBase.ExecuteAndAssertDeepEqual(query, {}, expected);
}
