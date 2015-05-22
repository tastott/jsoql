import lazy = require('lazy.js')     
import oboe = require('oboe')
import fs = require('fs')
import stream = require('stream')

interface StreamListener {
    (data: any) : void;
}

class OboeStream {
    private oboeObj: oboe.Oboe;

    constructor(stream: stream.Readable, private path : string) {
        this.oboeObj = oboe(stream);
    }

    removeListener(event: string, listener: StreamListener) {
        if (event !== 'data') throw new Error('Event type not recognized by Oboe Stream: ' + event);

        this.oboeObj.removeListener('node', listener);
    }

    on(event: string, listener: StreamListener) {
        switch (event) {
            case 'data':
                var pattern = this.path
                    ? `!.${this.path}.*`
                    : '!.*';

                this.oboeObj.node(this.path, listener);
                break;

            case 'end':
                this.oboeObj.done(listener);
                break;

            default:
                throw new Error('Event type not recognized by Oboe Stream: ' + event);
        }
    }

    resume() {

    }
}


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

export function lazyOboeFile(file: string, nodePath: string): LazyJS.AsyncSequence<any> {
    var sourceStream = fs.createReadStream(file);
    var oboeStream = new OboeStream(sourceStream, nodePath);
    var sequence = (<any>lazy).extensions[0](oboeStream);


    return sequence;
}