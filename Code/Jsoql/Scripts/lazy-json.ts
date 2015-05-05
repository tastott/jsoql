import lazy = require('lazy.js')     
import oboe = require('oboe')
import fs = require('fs')

var lazyJsonFileSequenceFactory = lazy.createWrapper(filepath => {
    var sequence = this;

    oboe(fs.createReadStream(filepath))
        .on('node', '!',(items: any[]) => {
            items.forEach(item => sequence.emit(item));
        })
        .start(() => { });
    
});

export var lazyJsonFile: (file: string) => LazyJS.Sequence<any> = lazyJsonFileSequenceFactory;