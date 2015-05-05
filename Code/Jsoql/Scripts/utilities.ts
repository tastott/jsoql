import fs = require('fs');

 
export function IsArray(value: any): boolean {
    return Object.prototype.toString.call(value) === '[object Array]';
}

export function ReadFirstLineSync(filepath: string, maxChars: number = 1024): string {
    if (maxChars > 1024) throw new Error('Maximum number of chars for first line must be 1024 or less');

    var buffer = new Buffer(1024);
    var fd = fs.openSync(filepath, 'r');
    var bytesRead = fs.readSync(fd, buffer, 0, maxChars, 0);

    return buffer.toString('utf8').split(/\r?\n/)[0];
}

