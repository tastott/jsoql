///<reference path="typings/node/node.d.ts"/>

module Jsoql {
    export module DataSources {

        var fs =  require('fs')
        var path = require('path')
        var csv = require('csv-string')
        var lazy: LazyJS.LazyStatic = require('lazy.js')

        export interface DataSourceParameters {
            format?: string;
            headers?: string;
            skip?: string;
        }

        export interface DataSource {
            Get(value: string, parameters: any, context: QueryContext): LazyJS.Sequence<any>;
        }

        interface LineHandler {
            Mapper: (line: string) => any;
            Skip: number;
        }

        export class FileDataSource implements DataSource {

            private GetLineMapper(filePath: string, parameters: DataSourceParameters): LineHandler {

                var extension = path.extname(filePath);

                //csv
                if (extension.toLowerCase() == '.csv' || (parameters.format && parameters.format.toLowerCase() == 'csv')) {

                    var headers: string[];
                    var skip: number;

                    //Explicit headers
                    if (parameters.headers) {
                        headers = parameters.headers.split(',');
                        skip = 0;
                    }
                    //Use first line as headers
                    else {
                        var firstLine = Utilities.ReadFirstLineSync(filePath);
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
                //json
                else {
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

            Get(value: string, parameters: DataSourceParameters, context: QueryContext): LazyJS.Sequence<any> {

                var fullPath = path.isAbsolute(value)
                    ? value
                    : path.join(context.BaseDirectory, value);

                if (!fs.existsSync(fullPath)) {
                    throw new Error('File not found: ' + fullPath);
                }
                else {

                    var lineHandler = this.GetLineMapper(fullPath, parameters);

                    var seq = lazy.readFile(fullPath, 'utf8')
                        .split(/\r?\n/)
                        .map(lineHandler.Mapper);

                    if (lineHandler.Skip) seq = seq.rest(lineHandler.Skip);

                    return seq;
                }

            }
        }

        export class VariableDataSource implements DataSource {
            Get(value: string, parameters: any, context: QueryContext): LazyJS.Sequence<any> {

                if (!context.Data || !context.Data[value]) {
                    console.log(context);
                    throw new Error("Target variable not found in context: '" + value + "'");
                }

                return lazy(context.Data[value]);
            }
        }
    }
}