import lazy = require('lazy.js')     
import oboe = require('oboe')
 
var lazyJsonFileSequenceFactory = lazy.createWrapper(eventSource => {
    var sequence = this;

    eventSource.handleEvent(function (data) {
        sequence.emit(data);
    });
});

export var lazyJsonFile: (file: string) => LazyJS.Sequence<any> = lazyJsonFileSequenceFactory;