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


document = window.document;
var brace = require('brace')
var Range = brace.acequire('ace/range').Range;
require('brace/mode/sql')

//Preload some themes
require('brace/theme/twilight');
require('brace/theme/chrome');
var editorThemes = {
    'dark': 'twilight',
    'light': 'chrome'
};

interface FileUriSuggestion {
    Value: string;
    Score: number;
}

export interface AppTheme {
    key: string;
}

export interface AppThemer {
    getSelected(): AppTheme;
    addWatcher(watcher: (theme: AppTheme) => void);
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
            dataFileService: _fs.FileService,
            queryExecutionService: qes.QueryExecutionService,
            themer : AppThemer) => {
            return new AceQueryEditorDirective(configuration, datasourceHistoryService, dataFileService, queryExecutionService, themer);
        };

        directive['$inject'] = ['configuration', 'datasourceHistoryService' ,'dataFileService', 'queryExecutionService', 'themer'];

        return directive;
    }

    constructor(private configuration: m.Configuration,
        private datasourceHistoryService: dshs.DatasourceHistoryService,
        private dataFileService: _fs.FileService,
        private queryExecutionService: qes.QueryExecutionService,
        private themer : AppThemer) {

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

            this.SetTheme(editor, this.themer.getSelected());
            this.themer.addWatcher(newTheme => this.SetTheme(editor, newTheme));
            
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

    private SetTheme(editor: AceAjax.Editor, theme: AppTheme) {
        if (theme && editorThemes[theme.key]) {
            var editorTheme = editorThemes[theme.key];
            try {
                editor.setTheme('ace/theme/' + editorTheme);
            }
            catch (ex) {
                console.log('Failed to set theme: ' + editorTheme);
                console.log(ex);
            }
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


