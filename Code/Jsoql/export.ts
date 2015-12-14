import stream = require('stream')
import Q = require('q')
let promisepipe = require('promisepipe')
let CsvWriteStream = require('csv-write-stream')

export class CsvExporter {
	
	public Export(items: any[], output: stream.Writable): Q.Promise<any> {
		var writer = CsvWriteStream({newline: require('os').EOL});
		
		var promise = promisepipe(
			writer,
			output
		);
		
		items.forEach(item => writer.write(item));
		writer.end();
		
		return promise;
	
	}
}