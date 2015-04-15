///<reference path="../typings/ace/ace.d.ts"/>

import $ = require('jquery')
import m = require('../models/models')
import Q = require('q')
import fServ = require('../Services/fileService')
import d = require('../models/dictionary')

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
        BaseDirectory: '=baseDirectory'
    }

    public static Factory() {
        var directive = (fileService: fServ.FileService, configuration: m.Configuration) => {
            return new AceQueryEditorDirective(fileService, configuration);
        };

        directive['$inject'] = ['fileService', 'configuration'];

        return directive;
    }

    constructor(private fileService: fServ.FileService, private configuration : m.Configuration) {
        this.link = ($scope: QueryEditorScope, element: JQuery, attributes: ng.IAttributes) => {
            console.log('inside link')

            var div = $('<div class="query-editor-ace"></div>')
                .appendTo(element)

            var editor: AceAjax.Editor = brace.edit(div[0]);
            editor.setTheme('ace/theme/ambiance');
            editor.getSession().setMode('ace/mode/sql');

            if ($scope.Query) editor.setValue($scope.Query.GetValue());

            editor.getSession().on('change', function (e) {
                if ($scope.Query) $scope.Query.SetValue(editor.getValue());
            });
            $scope.$watch('Query',(newValue: m.EditableText) => {
                if (newValue) editor.setValue(newValue.GetValue(), -1); //Move cursor to start
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

        var completers: AceCompleter[] = [];
        if (this.configuration.Environment == m.Environment.Desktop) {
            completers.push(new FileUriCompleter(this.fileService, () => $scope.BaseDirectory.Value()));
        }

        completers.forEach(c => langTools.addCompleter(c));
    } 
}

interface AceCompletion {
    name: string;
    value: string;
    score: number;
    meta: string;
}

interface AceCompleter {
    getCompletions(editor: AceAjax.Editor, session:
        AceAjax.IEditSession,
        pos: AceAjax.Position,
        prefix: string,
        callback: (something: any, completions: AceCompletion[]) => void) : void;
}

//Desktop-only
class FileUriCompleter implements AceCompleter{

    static FileUriRegex = new RegExp("'file://([^']*)$", "i")
    static ExtensionScores: d.Dictionary<number> = {
        '.json': 10,
        '.jsons': 20
    }

    constructor(private fileService: fServ.FileService,
        private getBaseDirectory: () => string) {
    }

    getCompletions(editor: AceAjax.Editor, session: AceAjax.IEditSession, pos: AceAjax.Position, prefix, callback) {

        if (pos.column == 0) callback(null, []);
        else {
            //Get whole line to this point (it would be nice to use prefix but '/' is a word boundary?)
            var lineToHereRange = new Range(pos.row, 0, pos.row, pos.column);
            var lineToHere = session.getTextRange(lineToHereRange);

            if (!lineToHere) callback(null, []);
            else {

                //Are we part-way through a file URI?
                var fileUriMatch = lineToHere.match(FileUriCompleter.FileUriRegex);
                if (!fileUriMatch) callback(null, []);
                else {
                    var fileUriPrefix = fileUriMatch[1];

                    this.GetFileUriSuggestions(this.getBaseDirectory(), fileUriPrefix)
                        .then(suggestions => callback(null, suggestions))
                        .fail(error => console.log(error));

                }
            }
        }
    }

    private GetFileUriSuggestions(baseDirectory: string, prefix: string): Q.Promise<AceCompletion[]> {

        var path = require('path');

        var pathPrefix = path.isAbsolute(prefix) || !baseDirectory
            ? prefix
            : baseDirectory + '\\' + prefix;
        
        var pattern = pathPrefix + '*'

        return this.fileService.GetMatches(pattern)
            .then(matches =>
                matches.map(file => {

                    var score = FileUriCompleter.ExtensionScores[path.extname(file).toLowerCase()] || 1;
                    if (pathPrefix) file = path.relative(pathPrefix, file);

                    return {
                        name: path.basename(file),
                        value: file,
                        score: 1,
                        meta: 'file'
                    };
                })
            );
    }

}