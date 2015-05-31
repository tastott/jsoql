import m = require('./models')
import fs =  require('fs')
import path = require('path')
var csv = require('csv-string')
var lazy : LazyJS.LazyStatic = require('./Hacks/lazy.node')
import util = require('./utilities')
import lazyJson = require('./lazy-json')
import lf = require('./lazy-files')
import evl = require('./evaluate')
import _stream = require('stream')
var glob = require('glob')
var replaceStream = require('replaceStream')

export interface DataSourceParameters {
    format?: string;
    headers?: string;
    skip?: string;
    root?: string;
}

export interface DataSourceSequencer {
    Get(value: string, parameters: any, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>;
}


export interface DataSourceSequencers {
    [scheme: string]: DataSourceSequencer;
}


interface LineHandler {
    Mapper: (line: string) => any;
    Skip: number;
}

interface FileSequencer {
    Validate(fileId: string, context: m.QueryContext): boolean;
    Sequence(fileId: string, context: m.QueryContext, parameters: DataSourceParameters): LazyJS.FileStreamSequence|LazyJS.StringLikeSequence;
    Stream(fileId: string, context: m.QueryContext, parameters: DataSourceParameters): _stream.Readable;
    FirstLine(fileId: string, context: m.QueryContext): string;
}

class FileSystemFileSequencer implements FileSequencer {

    protected GetFullPath(fileId: string, context: m.QueryContext): string {
        return path.isAbsolute(fileId)
            ? fileId
            : path.join(context.BaseDirectory, fileId);
    }

    Validate(fileId: string, context: m.QueryContext): boolean {
        return !fs.existsSync(this.GetFullPath(fileId, context));
    }

    Sequence(fileId: string, context: m.QueryContext, parameters: DataSourceParameters): LazyJS.FileStreamSequence|LazyJS.StringLikeSequence {
        var fullPath = this.GetFullPath(fileId, context);
        return lazy.readFile(fullPath, 'utf8');
    }

    Stream(fileId: string, context: m.QueryContext, parameters: DataSourceParameters): _stream.Readable {
        var fullPath = this.GetFullPath(fileId, context);
        return fs.createReadStream(fullPath);
    }

    FirstLine(fileId: string, context: m.QueryContext): string {
        return util.ReadFirstLineSync(this.GetFullPath(fileId, context));
    }
}

class StoredFileSequencer implements FileSequencer {
    constructor(private getStoredFile: (id: string)=> string) {
    }

    Validate(fileId: string, context: m.QueryContext): boolean {
        return !!window.localStorage.getItem(this.getStoredFile(fileId));
    }

    Sequence(fileId: string, context: m.QueryContext, parameters: DataSourceParameters): LazyJS.FileStreamSequence|LazyJS.StringLikeSequence {
        var content = this.getStoredFile(fileId);
        return lazy(content);
    }

    FirstLine(fileId: string, context: m.QueryContext): string {
        var content = this.getStoredFile(fileId);
        return lazy(content).split(/\r?\n/).first();
    }

    Stream(fileId: string, context: m.QueryContext, parameters: DataSourceParameters): _stream.Readable {
        var content = this.getStoredFile(fileId);
        var stream = new _stream.Readable();
       
        stream.push(content);
        stream.push(null);

        return stream;
    }
}

class AbstractLinedFileDataSourceSequencer implements DataSourceSequencer {

    constructor(private fileSequencer : FileSequencer) {
        
    }

    Get(value: string, parameters: any, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>{
        var lineHandler = this.GetLineHandler(this.fileSequencer.FirstLine(value, context), parameters);

        var seq = this.fileSequencer.Sequence(value, context, parameters)
            .split(/\r?\n/)
            .map(lineHandler.Mapper);

        if (lineHandler.Skip) seq = seq.rest(lineHandler.Skip);

        return seq;
    }

    protected GetLineHandler(firstLine : string, parameters: DataSourceParameters): LineHandler {
        throw new Error("Abstract method");
    }
}

class CsvFileDataSourceSequencer extends AbstractLinedFileDataSourceSequencer {

    constructor(baseFileSequencer: FileSequencer) {
        super(baseFileSequencer);
    }

    protected GetLineHandler(firstLine : string, parameters: DataSourceParameters): LineHandler {
        var headers: string[];
        var skip: number;

        //Explicit headers
        if (parameters.headers) {
            headers = parameters.headers.split(',');
            skip = 0;
        }
        //Use first line as headers
        else {
            headers = csv.parse(firstLine)[0];
            skip = 1;
        }

        //Use explicit skip if provided
        if (parameters.skip) {
            skip = parseInt(parameters.skip);
            if (isNaN(skip)) throw new Error(`Invalid value for 'skip': '${parameters.skip}'`);

        }

        return {
            Mapper: line => {
                var values = csv.parse(line)[0];
                return lazy(headers)
                    .zip(values)
                    .toObject();
            },
            Skip: skip
        };
    }
}

class JsonlFileDataSourceSequencer extends AbstractLinedFileDataSourceSequencer {
    constructor(baseFileSequencer: FileSequencer) {
        super(baseFileSequencer);
    }

    protected GetLineHandler(firstLine: string, parameters: DataSourceParameters): LineHandler {
        return {
            Mapper: line => {
                try {
                    return JSON.parse(line);
                }
                catch (err) {
                    throw 'Failed to parse line: ' + line;
                }
            },
            Skip: 0
        };
    }
}

class AbstractFileDataSourceSequencer implements DataSourceSequencer {
    Get(value: string, parameters: DataSourceParameters, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        var fullPath = path.isAbsolute(value)
            ? value
            : path.join(context.BaseDirectory, value);

        if (!fs.existsSync(fullPath)) {
            throw new Error('File not found: ' + fullPath);
        }
        else {

            return this.GetFromFile(fullPath, parameters);
        }

    }

    protected GetFromFile(fullPath: string, parameters: DataSourceParameters): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        throw new Error("Abstract method");
    }
}

class SimpleJsonFileSequencer extends AbstractFileDataSourceSequencer {
    protected GetFromFile(fullPath: string, parameters: DataSourceParameters): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        var json = fs.readFileSync(fullPath, 'utf8');
        json = json.replace(/^\uFEFF/, '');

        var results = JSON.parse(json);

        if (util.IsArray(results)) return lazy(<any[]>results);
        else return lazy([results]);
    }
}

class OboeJsonFileSequencer implements DataSourceSequencer {

    constructor(private fileSequencer: FileSequencer) { }

    Get(value: string, parameters: DataSourceParameters, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        var stream = this.fileSequencer.Stream(value, context, parameters);
        return lazyJson.lazyOboeFromStream(stream, parameters.root);
    }

}

export class FolderDataSourceSequencer implements DataSourceSequencer {
    Get(value: string, parameters: DataSourceParameters, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        
        var fullPath = path.isAbsolute(value)
            ? value
            : path.join(context.BaseDirectory, value);

        var pattern = parameters['pattern'] || '*.json';

        var files = glob.sync(fullPath + '/' + (parameters['recurse'] ? '**/' : '') + pattern);

        return lf.lazyFiles(files)
            .zip(files)
            .map((entry : string[]) => {
                var obj = JSON.parse(entry[0]);
                var fStats = fs.statSync(entry[1]);
                obj[FolderDataSourceSequencer.FileInfoProperty] = {
                    path: entry[1],
                    name: path.basename(entry[1]),
                    modifiedDate: fStats.mtime.toJSON(),
                    createdDate: fStats.ctime.toJSON()
                };
                return obj;             
            });
    }
    static FileInfoProperty = '@@File'
}

class SmartFileSequencer implements DataSourceSequencer {

    private datasources: {
        [name: string]: DataSourceSequencer;
    }

    private extensionToDataSource: {
        [extension: string]: string;
    }

    constructor(fileSequencer : FileSequencer) {
        this.datasources = {
            'csv': new CsvFileDataSourceSequencer(fileSequencer),
            'jsonl': new JsonlFileDataSourceSequencer(fileSequencer),
            //'json': new SimpleJsonFileDataSource(),
            'json': new OboeJsonFileSequencer(fileSequencer),
            '': new FolderDataSourceSequencer()
        };

        this.extensionToDataSource = {
            '.csv': 'csv',
            '.jsonl': 'jsonl',
            '.json': 'json'
        }
    }


    Get(value: string, parameters: DataSourceParameters, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        var ds = this.GetSubSource(value, parameters);
        return ds.Get(value, parameters, context);
    }

    protected GetSubSource(filepath: string, parameters: DataSourceParameters) : DataSourceSequencer{

        //Folder
        if (!path.extname(filepath)) {
            return this.datasources[''];
        }
        //Explicit format
        else if (parameters.format) {
            var format = parameters.format.toLowerCase();
            if (!this.datasources[format]) throw new Error("Unrecognized format specified: " + parameters.format);
            return this.datasources[format];
        }
        //Extension-inferred format
        else {
            var extension = (path.extname(filepath) || '').toLowerCase();

            if (this.extensionToDataSource[extension]) {
                return this.datasources[this.extensionToDataSource[extension]];
            }

            throw new Error('Unable to infer format for file: ' + filepath);
        }
    }
}

export class DesktopSmartFileSequencer implements DataSourceSequencer{
    private source: SmartFileSequencer;
    constructor() {
        this.source = new SmartFileSequencer(new FileSystemFileSequencer());
    }

    Get(value: string, parameters: DataSourceParameters, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        return this.source.Get(value, parameters, context);
    }
}

export class OnlineSmartFileSequencer implements DataSourceSequencer {
    private source: SmartFileSequencer;
    constructor(getStoredFile : (id : string) => string) {
        this.source = new SmartFileSequencer(new StoredFileSequencer(getStoredFile));
    }

    Get(value: string, parameters: DataSourceParameters, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        return this.source.Get(value, parameters, context);
    }
}

export class VariableDataSourceSequencer implements DataSourceSequencer {
    Get(value: string, parameters: any, context: m.QueryContext): LazyJS.Sequence<any> {

        var data: any[];

        if (!context.Data) {
            throw new Error("No context data");
        }
        else if (typeof value == 'string') {
            if (!context.Data[value]) {
                throw new Error("Target variable not found in context: '" + value + "'");
            }
            data = context.Data[value];
        }
        else {
            data = evl.Evaluator.Evaluate(value, context.Data);
            if (!util.IsArray(data)) data = [data];
        }

        return lazy(data);
    }
}

export class StreamingHttpSequencer implements DataSourceSequencer {

    Get(value: string, parameters: DataSourceParameters, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        var url = 'http://' + value;
        return lazyJson.lazyOboeHttp({
            url: url,
            nodePath: parameters.root
        });
    }
}

//This is a bit useless because it is still subject to cross-origin restrictions in a browser
export class WhateverOriginStreamingHttpDataSource implements DataSourceSequencer {

    constructor(private baseUrl: string) {
    }

    Get(value: string, parameters: any, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        var url = `${this.baseUrl}/get?url=${encodeURIComponent('http://'+ value)}&callback=callback`;
       
        return lazyJson.lazyOboeHttp({
            url: url,
            nodePath: parameters['path'],
            streamTransform: stream => stream
                    .pipe(replaceStream(/^callback\({"contents":"/, ''))
                    .pipe(replaceStream(/","status":.+$/, ''))
                    .pipe(replaceStream(/\\"/g, '"'))
        });
    }
}

export class YqlStreamingHttpSequencer implements DataSourceSequencer {

    constructor(private baseUrl: string) {
    }

    Get(value: string, parameters: any, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        var url = `${this.baseUrl}?q=${encodeURIComponent('select * from json where url="http://' + value + '"') }&format=json`;

        return lazyJson.lazyOboeHttp({
            url: url,
            nodePath: parameters['root'] ? `query.results.json.${parameters['root']}` : 'query.results.json',
            noCredentials: true
        });
    }
}

export class OnlineStreamingHttpSequencer implements DataSourceSequencer {

    private restrictedOriginDatasource: DataSourceSequencer;
    private localOrAnyOriginDatasource: DataSourceSequencer;

    constructor(yqlBaseUrl: string, private appBaseUrl: string) {
        this.restrictedOriginDatasource = new YqlStreamingHttpSequencer(yqlBaseUrl);
        this.localOrAnyOriginDatasource = new StreamingHttpSequencer();
    }

    Get(value: string, parameters: any, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        //Use any origin datasource if parameters indicate this explicitly
        if (parameters.anyOrigin) {
            return this.localOrAnyOriginDatasource.Get(value, parameters, context);
        }
        else {
            //Identify relative URLs using ~
            var relativeUrlMatch = value.match(/^~\/(.+)/);
            if (relativeUrlMatch) {
                //Strip base url of any scheme and trailing slash
                var baseUrl = this.appBaseUrl.replace(/^.+:\/\//, '').replace(/\/$/, '');

                var url = baseUrl + '/' + relativeUrlMatch[1];
                return this.localOrAnyOriginDatasource.Get(url, parameters, context);
            } else {
                return this.restrictedOriginDatasource.Get(value, parameters, context);
            }
        }
    }
}