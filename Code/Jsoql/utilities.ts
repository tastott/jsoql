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

export function MonoProp(value: any) {

    var keys = Object.keys(value);

    if (keys.length == 1) return value[keys[0]];
    else throw new Error("Expected exactly one property");
}

export function FindAllMatches(str: string, pattern: string, flags = ''): RegExpExecArray[]{

    if (flags.indexOf('g') < 0) flags += 'g';

    var results: RegExpExecArray[] = [];

    var regex = new RegExp(pattern, flags);
    var match = regex.exec(str);
    while (match) {
        results.push(match);
        match = regex.exec(str);
    }

    return results;
}

export class CallbackSet<T> {

    private callbacks: ((arg: T) => void)[];

    constructor() {
        this.callbacks = [];
    }

    public Add(callback: (arg: T) => void) {
        this.callbacks.push(callback);
    }

    public DoAll(arg: T, keepCallbacks : boolean = false) {
        this.callbacks.forEach(c => c(arg));
        if(!keepCallbacks) this.callbacks = [];
    }

    public RemoveAll() {
        this.callbacks = [];
    }
    
    public GetAll() {
        return this.callbacks;
    }

}