///<reference path="../typings/ace/ace.d.ts"/>

import $ = require('jquery')
import m = require('../models/models')
import Q = require('q')
import dshs = require('../Services/datasourceHistoryService')
import _fs = require('../Services/fileService')
import d = require('../models/dictionary')
import path = require('path') //OK in browser?
import lazy = require('lazy.js')

var keywords = [
    /select\s+/ig,
    /\s+as\s+/ig,
    /\s+from\s+/ig,
    /\s+join\s+/ig,
    /\s+on\s+/ig
];

export interface QueryEditorScope extends ng.IScope {
    Query: m.EditableText;
    BaseDirectory: m.EditableText;
    Execute: () => void;
}

export class QueryEditorDirective implements ng.IDirective {

    public scope = {
        value: '='
    }

    public templateUrl = 'Views/Directives/queryEditor.html';

    public link($scope: QueryEditorScope, element: JQuery, attributes: ng.IAttributes) {
        var editable = element.children();
        editable.html($scope.Query.GetValue());

        var onChange = require('debounce')(() => {
            var html = editable.html();
            var text = GetText(editable[0]);
            var colouredHtml = text;
            keywords.forEach(keyword => {
                colouredHtml = colouredHtml.replace(keyword,(match, capture) => '<span class="jsoql-keyword">' + match + '</span>');
            });
            editable.html(colouredHtml);
        }, 1000);

        editable.on('input',() => {
            onChange();
        });
    }

}


function GetText(node: Element): string {
    if (node.nodeType == 3) return node.textContent;
    else return $(node)
        .contents()
        .map((index, child) => GetText(child))
        .toArray()
        .join('');
}

document = window.document;
var brace = require('brace')
var Range = brace.acequire('ace/range').Range;
require('brace/mode/sql')
require('brace/theme/ambiance')

interface FileUriSuggestion {
    Value: string;
    Score: number;
}


// See http://blog.aaronholmes.net/writing-angularjs-directives-as-typescript-classes/

export class AceQueryEditorDirective  {
    public link: ($scope: QueryEditorScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) => void;
  
    public scope = {
        Query: '=query',
        BaseDirectory: '=baseDirectory',
        Execute: '=execute'
    }

    public static Factory() {
        var directive = (configuration: m.Configuration,
            datasourceHistoryService: dshs.DatasourceHistoryService,
            dataFileService: _fs.FileService) => {
            return new AceQueryEditorDirective(configuration, datasourceHistoryService, dataFileService);
        };

        directive['$inject'] = ['configuration', 'datasourceHistoryService' ,'dataFileService'];

        return directive;
    }

    constructor(private configuration: m.Configuration,
        private datasourceHistoryService: dshs.DatasourceHistoryService,
        private dataFileService : _fs.FileService) {

        this.link = ($scope: QueryEditorScope, element: JQuery, attributes: ng.IAttributes) => {
            console.log('inside link')

            var div = $('<div class="query-editor-ace"></div>')
                .appendTo(element)

            div.keyup(event => { 
                 //Execute on F5
                if (event.keyCode == 116) {
                    if ($scope.Execute) $scope.Execute();
                }
            });
            var editor: AceAjax.Editor = brace.edit(div[0]);
            editor.setTheme('ace/theme/ambiance');
            editor.getSession().setMode('ace/mode/sql');

            if ($scope.Query) editor.setValue($scope.Query.GetValue());

            editor.getSession().on('change', function (e) {
                if ($scope.Query) $scope.Query.SetValue(editor.getValue());
            });
            $scope.$watch('Query.Value()',(newValue: string) => {
                if (newValue) editor.setValue(newValue, -1); //Move cursor to start
                else editor.setValue('');
            });

            this.ConfigureAutoComplete(editor, $scope);
        }
    }

    private ConfigureAutoComplete(editor: any, $scope: QueryEditorScope) {
        require('brace/ext/language_tools')
        var langTools = brace.acequire("ace/ext/language_tools");
        console.log(langTools);

        editor.setOptions({ enableBasicAutocompletion: true });

        var completers: AceCompleter[] = [
            new RecentHttpCompleter(this.datasourceHistoryService),
            this.configuration.Environment == m.Environment.Desktop
                ? new FileSystemFileCompleter(() => $scope.BaseDirectory.Value())
                : new StoredFileCompleter(this.dataFileService)
        ];
       
        completers.forEach(c => langTools.addCompleter(c));
    } 
}

interface AceCompletion {
    name: string;
    value: string;
    score: number;
    meta: string;
    completer?: {
        insertMatch(editor, data): void;
    }
}

interface AceCompleter {
    getCompletions(editor: AceAjax.Editor, session:
        AceAjax.IEditSession,
        pos: AceAjax.Position,
        prefix: string,
        callback: (something: any, completions: AceCompletion[]) => void) : void;
}

export interface FudgedAceEditor extends AceAjax.Editor {
    completer: {
        completions: {
            filterText: string;
        }
    }
}

class UriCompleter {

    private unclosedUriRegex: RegExp;
    private uriPattern: string;

    constructor(private scheme: string) {
        this.unclosedUriRegex = new RegExp("'" + scheme + "://([^']*)$", "i");
        this.uriPattern = "'" + scheme + "://[^']*'?"; //Warning: this could over-match?
    }

    //Override this in sub-class to suggest completions for this partial URI
    protected GetUriSuggestions(uriPrefix: string): Q.Promise<AceCompletion[]> {
        throw new Error('Abstract method');
    }

    getCompletions(editor: AceAjax.Editor, session: AceAjax.IEditSession, pos: AceAjax.Position, prefix, callback) {

        if (pos.column == 0) callback(null, []);
        else {
            //Get whole line to this point (it would be nice to use prefix but '/' is a word boundary?)
            var lineToHereRange = new Range(pos.row, 0, pos.row, pos.column);
            var lineToHere = session.getTextRange(lineToHereRange);

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

    public insertMatch = (editor: FudgedAceEditor, completion: AceCompletion) => {

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

//Desktop-only
class AbstractFileUriCompleter extends UriCompleter implements AceCompleter{

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

    protected GetUriSuggestions(prefix: string): Q.Promise<AceCompletion[]> {

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

class FileSystemFileCompleter extends AbstractFileUriCompleter {
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

class StoredFileCompleter extends AbstractFileUriCompleter {
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


class RecentHttpCompleter extends UriCompleter implements AceCompleter {

    constructor(private datasourceHistoryService: dshs.DatasourceHistoryService) {
        super('http');
    }

    protected ExitUri(value: string): boolean {
        return true;
    }

    protected GetUriSuggestions(prefix: string): Q.Promise<AceCompletion[]> {
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
