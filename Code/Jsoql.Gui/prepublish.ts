import fs = require('fs')
import Q = require('q')

var readFilePromised = Q.denodeify<string>(fs.readFile);
var cmdFile = './cmd.js';

readFilePromised(cmdFile, 'utf8')
    .then(contents => addShebang(contents))
    .then(contents => fs.writeFile(cmdFile, contents));

function addShebang(contents: string) {
    var sbRegex = new RegExp('^#!/usr/bin/env node');
    if (!contents.match(sbRegex)) {
        return '#!/usr/bin/env node\n\n' + contents;
    }
    else return contents;
}