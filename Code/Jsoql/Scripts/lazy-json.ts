import lazy = require('lazy.js')     
import oboe = require('oboe')
import fs = require('fs')
import http = require('http')
import _stream = require('stream')


//Basically a copy of StreamedSequence from lazy.node.js because I don't know how to extend that "class"
function LazyStreamedSequence(openStream: (callback: (stream: _stream.Readable) => void) => void) {
    this.openStream = openStream;
}

LazyStreamedSequence.prototype = new (<any>lazy).StreamLikeSequence();

LazyStreamedSequence.prototype.each = function(fn) {
    var cancelled = false;

    var handle = new (<any>lazy).AsyncHandle(function cancel() { cancelled = true; });

    this.openStream(function (stream) {
        if (stream.setEncoding) {
            stream.setEncoding(this.encoding || 'utf8');
        }

        stream.resume();

        var listener = function (e) {
            try {
                if (cancelled || fn(e) === false) {
                    stream.removeListener("data", listener);
                    handle._resolve(false);
                }
            } catch (e) {
                handle._reject(e);
            }
        };

        stream.on("data", listener);

        stream.on("end", function () {
            handle._resolve(true);
        });
    });

    return handle;
}

interface StreamListener {
    (data: any) : void;
}

class OboeStream {
    private oboeObj: oboe.Oboe;

    constructor(private stream: _stream.Readable, private path : string) {
        this.oboeObj = oboe(stream);
    }

    removeListener = (event: string, listener: StreamListener) => {
        if (event !== 'data') throw new Error('Event type not recognized by Oboe Stream: ' + event);

        this.oboeObj.removeListener('node', listener);
    }

    on = (event: string, listener: StreamListener) => {
        switch (event) {
            case 'data':
                var pattern = this.path
                    ? `!.${this.path}.*`
                    : '!.*';
               // pattern = '!.contents.*';
                this.oboeObj.node(pattern, listener);
                break;

            case 'end':
                this.oboeObj.done(listener);
                break;

            default:
                throw new Error('Event type not recognized by Oboe Stream: ' + event);
        }
    }

    resume = () => {
        this.stream.resume();
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
export function lazyOboeHttp(options: {
    url: string;
    nodePath: string;
    streamTransform?: (stream: _stream.Readable) => _stream.Readable
}): LazyJS.AsyncSequence<any>  {

    var sequence = new LazyStreamedSequence(callback => {
        http.get(options.url, (sourceStream : _stream.Readable) => {

            if (options.streamTransform) {
                sourceStream = options.streamTransform(sourceStream);
            }

            var oboeStream = new OboeStream(sourceStream, options.nodePath);

            callback(<any>oboeStream);
        });
    });

    return <any>sequence;
}

export function lazyOboeFile(file: string, nodePath: string): LazyJS.AsyncSequence<any> {
   
    var sequence = new LazyStreamedSequence(callback => {
        var sourceStream = fs.createReadStream(file);
        var oboeStream = new OboeStream(sourceStream, nodePath);
        callback(<any>oboeStream);
    });

    return <any>sequence;
}