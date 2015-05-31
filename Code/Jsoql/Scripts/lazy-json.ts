var lazy: LazyJS.LazyStatic = require('./Hacks/lazy.node')  
import oboe = require('oboe')
import fs = require('fs')
import http = require('http')
import _url = require('url')
import m = require('./models')
import _stream = require('stream')
var XhrStream = require('buffered-xhr-stream')

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

    constructor(private stream: _stream.Readable, private path: string) {
        OboeStream.FudgeStreamForOboe(stream);
        this.oboeObj = oboe(stream);
    }

    //Oboe checks for the presence of these methods to determine whether or not
    //the value passed to the constructor is a stream
    //So let's make sure they're present! 
    static FudgeStreamForOboe(stream: _stream.Readable) {
        ['pause', 'pipe', 'unpipe', 'unshift'].forEach(method => {
            if (!stream[method]) stream[method] = () => {
                throw new Error('Not implemented. Only here to fool Oboe!');
            }
        });

        if (!stream['resume']) stream['resume'] = () => { };
    }

    removeListener = (event: string, listener: StreamListener) => {
        if (event !== 'data') throw new Error('Event type not recognized by Oboe Stream: ' + event);

        this.oboeObj.removeListener('node', listener);
    }

    on = (event: string, listener: StreamListener) => {
        switch (event) {
            case 'data':
                var pattern = this.path
                    ? `${this.path}.*`
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
        if(this.stream.resume) this.stream.resume();
    }
}



export function lazyOboeHttp(options: {
    url: string;
    nodePath: string;
    onError: m.ErrorHandler;
    noCredentials?: boolean;
    streamTransform?: (stream: _stream.Readable) => _stream.Readable
}): LazyJS.AsyncSequence<any>  {

    var errorHandler: m.ErrorHandler = err => options.onError(`Request to '${options.url}' failed. ${err.message}`);

    var sequence = new LazyStreamedSequence(callback => {

        //Create an XHR manually if we need to omit credentials (i.e. to avoid issues with CORS)
        if (options.noCredentials) {

            var xhr = new XMLHttpRequest();

            if (options.onError) {
                xhr.onerror = errorHandler;
            }

            xhr.withCredentials = false;
            xhr.open('GET', options.url, true);

            var sourceStream = new XhrStream({ xhr: xhr });

            if (options.streamTransform) {
                sourceStream = options.streamTransform(sourceStream);
            }

            var oboeStream = new OboeStream(sourceStream, options.nodePath);
            callback(<any>oboeStream);

        } else {
            var req = http.get(options.url,(sourceStream: _stream.Readable) => {

                if (options.streamTransform) {
                    sourceStream = options.streamTransform(sourceStream);
                }

                var oboeStream = new OboeStream(sourceStream, options.nodePath);

                callback(<any>oboeStream);
            });

            if (options.onError) req.on('error', errorHandler);
        }
    });

    return <any>sequence;
}

export function lazyOboeFromStream(stream : _stream.Readable, nodePath: string): LazyJS.AsyncSequence<any> {
   
    var sequence = new LazyStreamedSequence(callback => {
        var oboeStream = new OboeStream(stream, nodePath);
        callback(<any>oboeStream);
    });

    return <any>sequence;
}