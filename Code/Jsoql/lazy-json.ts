﻿var lazy: LazyJS.LazyStatic = require('./Hacks/lazy.node')  
var oboe = require('oboe')
import fs = require('fs')
import http = require('http')
import _url = require('url')
import m = require('./models')
import util = require('./utilities')
import _stream = require('stream')
var csv = require('csv-string')
import Q = require('q')
var XhrStream = require('buffered-xhr-stream')

//Basically a copy of StreamedSequence from lazy.node.js because I don't know how to extend that "class"
function LazyStreamedSequence(openStream: (onError: m.ErrorHandler) => _stream.Readable) {
        
    this.openStream = openStream;
    this.error = null;
}

LazyStreamedSequence.prototype = new (<any>lazy).StreamLikeSequence();

LazyStreamedSequence.prototype.each = function(fn) {
    var cancelled = false;
    var handle = new (<any>lazy).AsyncHandle(function cancel() { cancelled = true; });
    
    var onError : m.ErrorHandler = error => {
        handle._reject(error);
    }
    
    var stream: _stream.Readable;
    
    try {
        stream = this.openStream(onError);
    }
    catch(err) {
        handle._reject(err);
        return;
    }
    
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
        } catch (err) {
            handle._reject(err);
        }
    };

    stream.on("data", listener);

    stream.on("end", function () {
        handle._resolve(true);
    });

    stream.on("error", error => {
        handle._reject(error);
    });
     
    return handle;
}

interface StreamListener {
    (data: any) : void;
}

class CsvStream {
    private csvStream: _stream.Duplex;

    constructor(private stream: _stream.Readable, private headers : string[], private skip : number) {
        this.csvStream = csv.createStream();
    }

    removeListener = (event: string, listener: StreamListener) => {
        if (event !== 'data') throw new Error('Event type not recognized by CSV Stream: ' + event);

        this.csvStream.removeListener(event, listener);
    }

    on = (event: string, listener: StreamListener) => {
        switch (event) {
            case 'data':
                this.csvStream.on('data',(row: string[]) => {
                    if (this.skip > 0) {
                        --this.skip;
                    }
                    else {
                        var obj = lazy(this.headers)
                            .zip(row)
                            .toObject();

                        listener(obj);
                    }
                });
                break;

            case 'end':
                this.csvStream.on('end', listener);
                break;

            case 'error':
                this.csvStream.on('error', listener);
                break;

            default:
                throw new Error('Event type not recognized by CSV Stream: ' + event);
        }
    }

    resume = () => {
        this.stream.pipe(this.csvStream);
        if (this.stream.resume) this.stream.resume();
    }
}

class OboeStream {
    private oboeObj: any;
    private oboePattern: string;

    constructor(private stream: _stream.Readable, path: string) {
        OboeStream.FudgeStreamForOboe(stream);
        this.oboeObj = oboe(stream);
        this.oboePattern = path ? `${path}.*` : '!.*';
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

        if (!stream['resume']) (<any>stream)['resume'] = () => { };
    }

    removeListener = (event: string, listener: StreamListener) => {
        if (event !== 'data') throw new Error('Event type not recognized by Oboe Stream: ' + event);

        this.oboeObj.removeListener('node', this.oboePattern, listener);
    }

    on = (event: string, listener: StreamListener) => {
        switch (event) {
            case 'data':
               
               // pattern = '!.contents.*';
                this.oboeObj.node(this.oboePattern, data => {
                    listener(data);
                });
                break;

            case 'end':
                this.oboeObj.done(listener);
                break;

            case 'error':
                this.oboeObj.fail(error => {
                    var errorString = JSON.stringify(error);
                    listener(`JSON parse error: ${errorString}`);
                });
                break;

            default:
                throw new Error('Event type not recognized by Oboe Stream: ' + event);
        }
    }

    resume = () => {
        if(this.stream.resume) this.stream.resume();
    }
}

enum EnsureJsonArrayState {
    RootTypeNotKnownYet,
    RootTypeIsObject,
    RootTypeIsArray
}

class EnsureJsonArrayStream {
    private onData: util.CallbackSet<any>;
    private onEnd: util.CallbackSet<any>;
    private onError: util.CallbackSet<any>;

    private state: EnsureJsonArrayState;

    constructor(private jsonStream: _stream.Readable) {

        this.onData = new util.CallbackSet<any>();
        this.onEnd = new util.CallbackSet<any>();
        this.onError = new util.CallbackSet<any>();

        this.state = EnsureJsonArrayState.RootTypeNotKnownYet;

        //not applicable in browser?
        if(jsonStream.setEncoding) jsonStream.setEncoding('utf8');

        jsonStream.on('data', data => {
            if (typeof data === "string" && this.state == EnsureJsonArrayState.RootTypeNotKnownYet) {
                var nonWhiteSpaceMatch = data.match(/\S/);

                //Root is array, no need to fiddle with source stream
                if (nonWhiteSpaceMatch && nonWhiteSpaceMatch[0] == '[') {
                    this.state = EnsureJsonArrayState.RootTypeIsArray;
                    this.onData.DoAll(data, true);
                }
                //Root is object, prepend '[' and remember to append ']' when source is finished
                else if (nonWhiteSpaceMatch && nonWhiteSpaceMatch[0] == '{') {
                    this.state = EnsureJsonArrayState.RootTypeIsObject;
                    this.onData.DoAll('[' + data, true);
                }
            }
            else {
                this.onData.DoAll(data, true);
            }
        });

        //Append ']' for object root
        jsonStream.on('end',() => {
            if (this.state == EnsureJsonArrayState.RootTypeIsObject) {
                this.onData.DoAll(']', true);
            }

            this.onEnd.DoAll(null);
        });

        jsonStream.on('error', err => {
            this.onError.DoAll(err, true);
        });
    }

    public readable = true;
    public _read = null;

    removeListener = (event: string, listener: StreamListener) => {
        this.jsonStream.removeListener(event, listener);
    }

    on = (event: string, listener: StreamListener) => {
        switch (event) {
            case 'data':
                this.onData.Add(listener);
                break;

            case 'end':
                this.onEnd.Add(listener);
                break;

            case 'error':
                this.onError.Add(listener);
                break;

            default:
                throw new Error('Event type not recognized by EnsureJsonArrayStream: ' + event);
        }
    }

    resume = () => {
        if (this.jsonStream.resume) this.jsonStream.resume();
    }
  
}

class HttpStream {
    
    private dataCallbacks: util.CallbackSet<any>;
    private errorCallbacks: util.CallbackSet<any>;
    private endCallbacks: util.CallbackSet<any>;
    
    private stream: _stream.Readable;
    
    constructor(url:string, transformStream: (source: _stream.Readable) => _stream.Readable){
        this.dataCallbacks = new util.CallbackSet<any>();
        this.errorCallbacks = new util.CallbackSet<any>();
        this.endCallbacks = new util.CallbackSet<any>();
        this.stream = null;
        
        var req = http.get(url,(res) => {
    
            if (res.statusCode !== 200) {
                this.errorCallbacks.DoAll(`Bad response status: ${res.statusMessage} (${res.statusCode})`, true);
            } else {
                 this.stream = transformStream ? transformStream(res) : res;
                
                this.RegisterCallbacks('data', this.stream, this.dataCallbacks);
                this.RegisterCallbacks('end', this.stream, this.endCallbacks);
                this.RegisterCallbacks('error', this.stream, this.errorCallbacks);
            }
        });
    
        req.on('error', error => {
            this.errorCallbacks.DoAll(error, true);
        });
    }
    
    private RegisterCallbacks(event:string, stream: _stream.Readable, callbacks: util.CallbackSet<any>) {
        callbacks.GetAll().forEach(callback => this.stream.on(event, callback));
        callbacks.RemoveAll();
    }
    
    on = (event: string, listener: StreamListener) => {
        if(this.stream){
            this.stream.on(event, listener);
            return;
        }
        
        switch(event){
            case 'data':
                this.dataCallbacks.Add(listener);
                break;
            case 'end':
                this.endCallbacks.Add(listener);
                break;
            case 'error':
                this.errorCallbacks.Add(listener);
                break;
                
            default:
                throw new Error(`Unrecognized event type for stream: ${event}`);
        }
    }
    
    resume = () => {
        if(this.stream && this.stream.resume) this.stream.resume();
    }
}


export function lazyOboeHttp(options: {
    url: string;
    nodePath: string;
    //onError: m.ErrorHandler;
    noCredentials?: boolean;
    streamTransform?: (stream: _stream.Readable) => _stream.Readable
}): LazyJS.AsyncSequence<any>  {

    //var errorHandler: m.ErrorHandler = err => options.onError(`Request to '${options.url}' failed. ${err.message}`);

    var sequence = new LazyStreamedSequence(errorHandler => {

        //Create an XHR manually if we need to omit credentials (i.e. to avoid issues with CORS)
        if (options.noCredentials) {

            var xhr = new XMLHttpRequest();

            xhr.onerror = errorHandler;

            xhr.withCredentials = false;
            xhr.open('GET', options.url, true);

            var sourceStream = new XhrStream({ xhr: xhr });

            if (options.streamTransform) {
                sourceStream = options.streamTransform(sourceStream);
            }

            //Wrap an object root as an array
            sourceStream = new EnsureJsonArrayStream(sourceStream);

            var oboeStream = new OboeStream(sourceStream, options.nodePath);
            return <any>oboeStream;

        } else {
            return new HttpStream(options.url,
                    sourceStream => {
    
                        if (options.streamTransform) {
                            sourceStream = options.streamTransform(sourceStream);
                        }
    
                        //Wrap an object root as an array
                        sourceStream = <any>new EnsureJsonArrayStream(sourceStream);
    
                        var oboeStream = new OboeStream(sourceStream, options.nodePath);
    
                        return <any>oboeStream;
                });
        }
    });

    return <any>sequence;
}

export function lazyOboeFromStream(stream : _stream.Readable, nodePath: string): LazyJS.AsyncSequence<any> {
   
    var sequence = new LazyStreamedSequence(errorHandler => {
        //Wrap an object root as an array
        stream = <any>new EnsureJsonArrayStream(stream);

        var oboeStream = new OboeStream(stream, nodePath);
        return <any>oboeStream;
    });

    return <any>sequence;
}

export function lazyCsvFromStream(stream: _stream.Readable, headers: string[], skip : number = 0): LazyJS.AsyncSequence<any>  {

    var sequence = new LazyStreamedSequence(errorHandler => {
        var csvStream = new CsvStream(stream, headers, skip);
        return <any>csvStream;
    });

    return <any>sequence;
}


