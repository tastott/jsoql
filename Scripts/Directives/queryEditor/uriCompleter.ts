import qem = require('./models')
import qeUtil = require('./utilities')
import path = require('path')
import _fs = require('../../Services/fileService')
import dshs = require('../../Services/datasourceHistoryService')
import lazy = require('lazy.js')
var brace = require('brace')
var Range = brace.acequire('ace/range').Range;

export class UriCompleter {

    private unclosedUriRegex: RegExp;
    private uriPattern: string;

    constructor(private scheme: string) {
        this.unclosedUriRegex = new RegExp("'" + scheme + "://([^']*)$", "i");
        this.uriPattern = "'" + scheme + "://[^']*'?"; //Warning: this could over-match?
    }

    //Override this in sub-class to suggest completions for this partial URI
    protected GetUriSuggestions(uriPrefix: string): Q.Promise<qem.AceCompletion[]> {
        throw new Error('Abstract method');
    }

    getCompletions(editor: AceAjax.Editor, session: AceAjax.IEditSession, pos: AceAjax.Position, prefix, callback) {

        if (pos.column == 0) callback(null, []);
        else {
            //Get whole line to this point (it would be nice to use prefix but '/' is a word boundary?)
            var lineToHere = qeUtil.GetLineToHere(session, pos);

            if (!lineToHere) callback(null, []);
            else {

                //Are we part-way through a URI?
                var uriMatch = lineToHere.match(this.unclosedUriRegex);
                if (!uriMatch) callback(null, []);
                else {
                    var uriPrefix = uriMatch[1];

                    this.GetUriSuggestions(uriPrefix)
                        .then(suggestions => {
                            //Use this.insert() method to effect the completion
                            suggestions.forEach(s => s.completer = this);
                            callback(null, suggestions);
                        })
                        .fail(error => console.log(error));

                }
            }
        }
    }

    //Override this in sub-class to indicate whether or not the caret should be moved out of the completed value
    protected ExitUri(value: string): boolean {
        throw new Error('Abstract method');
    }

    public insertMatch = (editor: qem.FudgedAceEditor, completion: qem.AceCompletion) => {

        var position = editor.selection.getRange().start;

        //Find this partial URI with a search (probably a better way to do this?)
        var search: AceAjax.Range = editor.find(this.uriPattern, {
            caseSensitive: false,
            range: new Range(position.row, 0, position.row + 1, 0), //Search whole row
            regExp: true,
            start: new Range(position.row, 0, position.row, 0)
        });
        editor.replace("'" + this.scheme + "://" + completion.value + "'");

        if (!search) throw new Error('Unable to find URI to replace');

        var selectionEnd = editor.selection.getRange().end;
        var newCursorPos: AceAjax.Position;
        //Move cursor outside quotes if appropriate
        if (this.ExitUri(completion.value)) newCursorPos = { row: selectionEnd.row, column: selectionEnd.column };
        //Otherwise keep cursor inside quotes
        else newCursorPos = { row: selectionEnd.row, column: selectionEnd.column - 1 };

        editor.selection.setRange(new Range(newCursorPos.row, newCursorPos.column, newCursorPos.row, newCursorPos.column), false);

    }
}

export class AbstractFileUriCompleter extends UriCompleter implements qem.AceCompleter{

    static UnclosedFileUriRegex = new RegExp("'file://([^']*)$", "i")
    static FileUriPattern = "'file://[^']*'?"; //Warning: this could over-match?

    static ExtensionScores = {
        '.csv': 99,
        '.json': 100,
        '.jsonl': 101
    }

    constructor() {
        super('file');
    }

    protected GetMatchingFiles(prefix: string): Q.Promise<string[]> {
        throw new Error("Abstract method");
    }

    protected ExitUri(value: string): boolean {
        return !!path.extname(value);
    }

    protected GetUriSuggestions(prefix: string): Q.Promise<qem.AceCompletion[]> {

        return this.GetMatchingFiles(prefix)
            .then(matches =>
                matches.map(file => {

                    var ext = path.extname(file).toLowerCase();
                    var score = AbstractFileUriCompleter.ExtensionScores[ext] || 99;

                    if (!ext) file += '\\'; //Directory

                    return {
                        name: path.basename(file),
                        value: file,
                        score: score,
                        meta: ext ? 'file' : 'folder'
                    };
                })
            );
    }

}

export class FileSystemFileCompleter extends AbstractFileUriCompleter {
    constructor(private getBaseDirectory: () => string) {
        super();
    }

    private globPromised: (pattern: string, options: any) => Q.Promise<string[]> = Q.denodeify<string[]>(require('glob'));

    protected GetMatchingFiles(prefix: string): Q.Promise<string[]>{

        var baseDirectory = this.getBaseDirectory();

        var pattern = (path.isAbsolute(prefix) || !baseDirectory)
            ? prefix + '*'
            : baseDirectory + '\\' + prefix + '*';

        return this.globPromised(pattern, null)
            .then(files =>
                files.map(file => baseDirectory ? path.relative(baseDirectory, file) : file)
            );
    }
}

export class StoredFileCompleter extends AbstractFileUriCompleter {
    constructor(private dataFileService : _fs.FileService) {
        super();
    }

    protected GetMatchingFiles(prefix: string): Q.Promise<string[]> {
        var regex = new RegExp('^' + prefix, 'i');

        var matches = this.dataFileService.GetAll()
            .map(storedFile => storedFile.Id)
            .filter(id => !!id.match(regex))
        

        return Q(matches);
    }
}


export class RecentHttpCompleter extends UriCompleter implements qem.AceCompleter {

    constructor(private datasourceHistoryService: dshs.DatasourceHistoryService) {
        super('http');
    }

    protected ExitUri(value: string): boolean {
        return true;
    }

    protected GetUriSuggestions(prefix: string): Q.Promise<qem.AceCompletion[]> {
        var suggestions = lazy(this.datasourceHistoryService.GetRecent('http'))
            .filter(ds => !prefix || ds.Value.indexOf(prefix) >= 0)
            .first(10)
            .map(ds => {
                return {
                    name: ds.Value,
                    value: ds.Value,
                    score: 100,
                    meta: 'url'
                };
            })
            .toArray();
            
        return Q(suggestions);
    }
}
