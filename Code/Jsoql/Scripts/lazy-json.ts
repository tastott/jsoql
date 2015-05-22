import lazy = require('lazy.js')     
import oboe = require('oboe')
import fs = require('fs')


function OboeHttpSequence(url : string, path : string) {
    this.url = url;
    this.path = path;
}
OboeHttpSequence.prototype = new (<any>lazy).StreamLikeSequence();
OboeHttpSequence.prototype.each = function (fn) {
    var cancelled = false;

    var handle = new (<any>lazy).AsyncHandle(function cancel() { cancelled = true; });
    var oboeStream = oboe(this.url);

    var listener = function (e) {
        try {
            if (cancelled || fn(e) === false) {
                oboeStream.removeListener("node", listener);
                handle._resolve(false);
            }
        } catch (e) {
            handle._reject(e);
        }
    };

    var pattern = this.path
        ? `!.${this.path}.*`
        : '!.*';

    oboeStream.node(pattern, listener);
    oboeStream.done(function () {
        handle._resolve(true);
    });


    return handle;
};

//export var lazyJsonFile: (file: string) => LazyJS.Sequence<any> = lazyJsonFileSequenceFactory;
export var lazyOboeHttp: (url: string, path? : string) => LazyJS.AsyncSequence<any> = (url, path) => {
    return new OboeHttpSequence(url, path);
}