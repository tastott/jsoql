import m = require('./models')
import fs =  require('fs')
import path = require('path')
var csv = require('csv-string')
import lazy = require('lazy.js')
import util = require('./utilities')
import lazyJson = require('./lazy-json')
import lf = require('./lazy-files')
import evl = require('./evaluate')
var glob = require('glob')
var replaceStream = require('replaceStream')

export interface DataSourceParameters {
    format?: string;
    headers?: string;
    skip?: string;
    root?: string;
}

export interface DataSource {
    Get(value: string, parameters: any, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>;
}


export interface DataSources {
    [scheme: string]: DataSource;
}


interface LineHandler {
    Mapper: (line: string) => any;
    Skip: number;
}

class AbstractFileDataSource implements DataSource {
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

class AbstractLinedFileDataSource extends AbstractFileDataSource {
    protected GetFromFile(fullPath: string, parameters: DataSourceParameters): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        var lineHandler = this.GetLineHandler(fullPath, parameters);

        var seq = lazy.readFile(fullPath, 'utf8')
            .split(/\r?\n/)
            .map(lineHandler.Mapper);

        if (lineHandler.Skip) seq = seq.rest(lineHandler.Skip);

        return seq;
    }

    protected GetLineHandler(fullPath : string, parameters: DataSourceParameters): LineHandler {
        throw new Error("Abstract method");
    }
}

class CsvFileDataSource extends AbstractLinedFileDataSource {
    protected GetLineHandler(fullPath : string, parameters: DataSourceParameters): LineHandler {
        var headers: string[];
        var skip: number;

        //Explicit headers
        if (parameters.headers) {
            headers = parameters.headers.split(',');
            skip = 0;
        }
        //Use first line as headers
        else {
            var firstLine = util.ReadFirstLineSync(fullPath);
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

class JsonlFileDataSource extends AbstractLinedFileDataSource {
    protected GetLineHandler(fullPath: string, parameters: DataSourceParameters): LineHandler {
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

class SimpleJsonFileDataSource extends AbstractFileDataSource {
    protected GetFromFile(fullPath: string, parameters: DataSourceParameters): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>{

        var json = fs.readFileSync(fullPath, 'utf8');
        json = json.replace(/^\uFEFF/, '');

        var results = JSON.parse(json);

        if (util.IsArray(results)) return lazy(<any[]>results);
        else return lazy([results]);
    }
}

class OboeJsonFileDataSource extends AbstractFileDataSource {
    protected GetFromFile(fullPath: string, parameters: DataSourceParameters): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        return lazyJson.lazyOboeFile(fullPath, parameters.root);
    }
}

export class FolderDataSource implements DataSource {
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
                obj[FolderDataSource.FileInfoProperty] = {
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

export class SmartFileDataSource implements DataSource {

    private datasources: {
        [name: string]: DataSource;
    }

    private extensionToDataSource: {
        [extension: string]: string;
    }

    constructor() {
        this.datasources = {
            'csv': new CsvFileDataSource(),
            'jsonl': new JsonlFileDataSource(),
            //'json': new SimpleJsonFileDataSource(),
            'json': new OboeJsonFileDataSource(),
            '': new FolderDataSource()
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

    protected GetSubSource(filepath: string, parameters: DataSourceParameters) : DataSource{

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

export class VariableDataSource implements DataSource {
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
            data = evl.Evaluator.Evaluate(value, context.Data) || []; //TODO: Is this OK?
            if (!util.IsArray(data)) data = [data];
        }

        return lazy(data);
    }
}

export class StreamingHttpDataSource implements DataSource {

    Get(value: string, parameters: DataSourceParameters, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        var url = 'http://' + value;
        return lazyJson.lazyOboeHttp({
            url: url,
            nodePath: parameters.root
        });
    }
}

//This is a bit useless because it is still subject to cross-origin restrictions in a browser
export class WhateverOriginStreamingHttpDataSource implements DataSource {

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

export class YqlStreamingHttpDataSource implements DataSource {

    constructor(private baseUrl: string) {
    }

    Get(value: string, parameters: any, context: m.QueryContext): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {
        var url = `${this.baseUrl}?q=${encodeURIComponent('select * from json where url="http://' + value + '"') }&format=json`;

        return lazyJson.lazyOboeHttp({
            url: url,
            nodePath: parameters['path'] ? `query.results.json.${parameters['path']}` : 'query.results.json',
            noCredentials: true
        });
    }
}