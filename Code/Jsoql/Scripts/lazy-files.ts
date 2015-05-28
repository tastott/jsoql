var lazy: LazyJS.LazyStatic = require('./Hacks/lazy.node')
import oboe = require('oboe')
import fs = require('fs')


class FilesIterator {
    private index = -1;

    constructor(private files : string[]) {

    }
    current(): any {
        return fs.readFileSync(this.files[this.index]);
    }
    moveNext(): boolean {
        this.index++;
        return this.index < this.files.length;
    }
}

function FilesSequence(files : string[]) {
    var self = this;
    self.iterator = new FilesIterator(files);

    self.getIterator = () => {
        return self.iterator;
    }
}
//FilesSequence.prototype = new (<any>lazy).AsyncSequence();
//FilesSequence.prototype.getIterator = () => {
//    return this.iterator;
//}

//var lazyFilesSequenceFactory = lazy.createWrapper((files : string[]) => {
//    var sequence = this;

//    oboe(fs.createReadStream(filepath))
//        .on('node', '!',(items: any[]) => {
//        items.forEach(item => sequence.emit(item));
//    })
//        .start(() => { });

//});

//export var lazyJsonFile: (file: string) => LazyJS.Sequence<any> = lazyJsonFileSequenceFactory;
export var lazyFiles: (files: string[]) => LazyJS.Sequence<any> = (files: string[]) => {
    var sequence = new (<any>lazy).AsyncSequence(new FilesSequence(files));
    return sequence;
}