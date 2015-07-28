///<reference path="../typings/node/node.d.ts" />
import fs = require('fs')
import path = require('path')
import Q = require('q')

function mungeTestFile(filepathIn : string, filepathOut : string) : Q.Promise<any>{
	var filename = path.basename(filepathIn, '.ts');
	
	return Q.nfcall<string>(fs.readFile, filepathIn, 'utf8')
		.then(js => {
			var split = js.split(/(?=export\s+function)/g);
			return `///<reference path="../typings/mocha/mocha.d.ts" /> \n${split[0]}\ndescribe('${filename}', () => {\n${split.slice(1).join('')}\n})`;
		})
		.then(js => js.replace(/export\s+function\s+([A-Za-z0-9_]+)\(\)\s*\{([\s\S]+?)\}((?=\s*export)|$)/g, 
			(text, match1, match2) => {
				
				return `it('${match1}', () => {\n${match2}})`;
			})
		)
		.then(js => Q.nfcall<any>(fs.writeFile, filepathOut, js));
}

mungeTestFile('selectTests.ts', 'selectTests-munged.ts')
	.done();