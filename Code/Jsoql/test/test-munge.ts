///<reference path="../typings/node/node.d.ts" />
import fs = require('fs')
import path = require('path')
import Q = require('q')
var glob = require('glob')

function mungeTestFile(filepathIn : string, filepathOut : string) : Q.Promise<any>{
	var filename = path.basename(filepathIn, '.ts');
	
	return Q.nfcall<string>(fs.readFile, filepathIn, 'utf8')
		.then(js => {
			js = js.replace(/^\uFEFF/, '');
			var split = js.split(/(?=export\s+function)/g);
			return `///<reference path="../typings/mocha/mocha.d.ts" /> \n${split[0]}\ndescribe('${filename}', () => {\n${split.slice(1).join('')}\n})`;
		})
		.then(js => js.replace(/export\s+function\s+([A-Za-z0-9_]+)\(\)\s*\{([\s\S]+?)\n\}/g, 
			(text, match1, match2) => {
				
				return `it('${match1}', () => {\n${match2}})`;
			})
		)
		.then(js => Q.nfcall<any>(fs.writeFile, filepathOut, js));
}

Q.nfcall<string[]>(glob, path.resolve(__dirname, 'old/*Tests.ts'))
	.then(files => {
		return Q.all(files.map(f => mungeTestFile(f, path.basename(f))));
	})
	.done();