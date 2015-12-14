///<reference path="../typings/mocha/mocha.d.ts" /> 
import assert = require('assert');
import testBase = require('./testBase');
import {CsvExporter} from '../export'
import fs = require('fs')
import chai = require('chai')
let expect = chai.expect;

describe('CSV Export Tests', () => {
    it('Test', () => {

        var data = [
            { Name: 'Banana', Colour: 'Yellow' },
            { Name: 'Apple', Colour: 'Green' }
        ];
        
        var file = './csv-export-test.csv';
        var exporter = new CsvExporter();
        if(fs.existsSync(file)) fs.unlinkSync(file);
        
        return exporter.Export(data, fs.createWriteStream(file, {encoding:'utf8'}))
            .then(() => {
                var contents = fs.readFileSync(file, 'utf8');
                expect(contents).to.be.equal(
                    ['Name,Colour',
                    'Banana,Yellow',
                    'Apple,Green', 
                    ''].join(require('os').EOL)
                );
            })
    })

})