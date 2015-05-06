import lazy = require('lazy.js')     
import oboe = require('oboe')
import fs = require('fs')


class OboeIterator  {
    private values = [1, 2, 3, 4].map(i => {
        return {
            Value: i
        };
    });
    private index = -1;

    constructor() {

    }
    current(): any {
        return this.values[this.index];
    }
    moveNext(): boolean {
        this.index++;
        return this.index < this.values.length;
    }
}

function OboeSequence() {
    var self = this;
}
OboeSequence.prototype = new (<any>lazy).AsyncSequence();
OboeSequence.prototype.getIterator = () => {
    return new OboeIterator();
}

var lazyJsonFileSequenceFactory = lazy.createWrapper(filepath => {
    var sequence = this;

    oboe(fs.createReadStream(filepath))
        .on('node', '!',(items: any[]) => {
            items.forEach(item => sequence.emit(item));
        })
        .start(() => { });
    
});

//export var lazyJsonFile: (file: string) => LazyJS.Sequence<any> = lazyJsonFileSequenceFactory;
export var lazyJsonFile: (file: string) => LazyJS.Sequence<any> = () => {
    var sequence = new (<any>lazy).AsyncSequence();
    sequence.parent = new OboeSequence();
    return sequence;
}