///<reference path="../../typings/ace/ace.d.ts"/>

import $ = require('jquery')
import m = require('../../models/models')
import Q = require('q')
import dshs = require('../../Services/datasourceHistoryService')
import _fs = require('../../Services/fileService')
import qes = require('../../Services/queryExecutionService')
import d = require('../../models/dictionary')
import uriC = require('./uriCompleter')
import propC = require('./propertyCompleter')
import lazy = require('lazy.js')
import qem = require('./models')

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
    Theme: string;
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

//Preload some themes
require('brace/theme/twilight');
require('brace/theme/ambiance');

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
        Execute: '=execute',
        Theme: '=theme'
    }

    public static Factory() {
        var directive = (configuration: m.Configuration,
            datasourceHistoryService: dshs.DatasourceHistoryService,
            dataFileService: _fs.FileService,
            queryExecutionService: qes.QueryExecutionService) => {
            return new AceQueryEditorDirective(configuration, datasourceHistoryService, dataFileService, queryExecutionService);
        };

        directive['$inject'] = ['configuration', 'datasourceHistoryService' ,'dataFileService', 'queryExecutionService'];

        return directive;
    }

    constructor(private configuration: m.Configuration,
        private datasourceHistoryService: dshs.DatasourceHistoryService,
        private dataFileService: _fs.FileService,
        private queryExecutionService : qes.QueryExecutionService) {

        this.link = ($scope: QueryEditorScope, element: JQuery, attributes: ng.IAttributes) => {
   
            var div = $('<div class="query-editor-ace"></div>')
                .appendTo(element)

            div.keyup(event => { 
                 //Execute on F5
                if (event.keyCode == 116) {
                    if ($scope.Execute) $scope.Execute();
                }
            });
            var editor: AceAjax.Editor = brace.edit(div[0]);
            editor.setShowPrintMargin(false);

            $scope.$watch('Theme', newTheme => {
                if (newTheme) {
                    try {
                        editor.setTheme('ace/theme/' + newTheme);
                    }
                    catch (ex) {
                        console.log('Failed to set theme: ' + newTheme);
                        console.log(ex);
                    }
                }
            });

         
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

        var completers: qem.AceCompleter[] = [
            new propC.PropertyCompleter(this.queryExecutionService, () => $scope.BaseDirectory.Value()),
            new uriC.RecentHttpCompleter(this.datasourceHistoryService),
            this.configuration.Environment == m.Environment.Desktop
                ? new uriC.FileSystemFileCompleter(() => $scope.BaseDirectory.Value())
                : new uriC.StoredFileCompleter(this.dataFileService)
        ];
       
        completers.forEach(c => langTools.addCompleter(c));
    } 
}


