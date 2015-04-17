var lazy: LazyJS.LazyStatic = require('lazy.js')     
var factory = lazy.createWrapper(eventSource => {
    var sequence = this;

    eventSource.handleEvent(function (data) {
        sequence.emit(data);
    });
});

module Jsoql {
    export module Lazy {
        export var lazyJsonFile: (file: string) => LazyJS.Sequence<any> = factory;
    }
}