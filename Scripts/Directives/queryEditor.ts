///<reference path="../typings/ace/ace.d.ts"/>

import $ = require('jquery')
import m = require('../models/models')

var keywords = [
    /select\s+/ig,
    /\s+as\s+/ig,
    /\s+from\s+/ig,
    /\s+join\s+/ig,
    /\s+on\s+/ig
];

export interface QueryEditorScope extends ng.IScope {
    Query: m.EditableText;
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
require('brace/mode/sql')
require('brace/theme/ambiance')

export class AceQueryEditorDirective implements ng.IDirective {

    public scope = {
        Query: '=value'
    }

    public link = ($scope: QueryEditorScope, element: JQuery, attributes: ng.IAttributes) => {
        var div = $('<div class="query-editor-ace"></div>')
            .appendTo(element)

        var editor : AceAjax.Editor = brace.edit(div[0]);
        editor.setTheme('ace/theme/ambiance');
        editor.getSession().setMode('ace/mode/sql');

        if ($scope.Query) editor.setValue($scope.Query.GetValue());

        editor.getSession().on('change', function (e) {
            if($scope.Query) $scope.Query.SetValue(editor.getValue());
        });
        $scope.$watch('Query',(newValue: m.EditableText) => {
            if (newValue) editor.setValue(newValue.GetValue(), -1); //Move cursor to start
            else editor.setValue('');
        });

        this.ConfigureAutoComplete(editor);
    }

    private ConfigureAutoComplete(editor: any) {
        require('brace/ext/language_tools')
        var langTools = brace.acequire("ace/ext/language_tools");
        console.log(langTools);

        editor.setOptions({ enableBasicAutocompletion: true });
        // uses http://rhymebrain.com/api.html
        var rhymeCompleter = {
            getCompletions: function (editor, session, pos, prefix, callback) {
                if (prefix.length === 0) { callback(null, []); return }
                $.getJSON(
                    "http://rhymebrain.com/talk?function=getRhymes&word=" + prefix,
                    function (wordList) {
                        // wordList like [{"word":"flow","freq":24,"score":300,"flags":"bc","syllables":"1"}]
                        callback(null, wordList.map(function (ea) {
                            return { name: ea.word, value: ea.word, score: ea.score, meta: "rhyme" }
                        }));
                    })
            }
        }
        langTools.addCompleter(rhymeCompleter);
    }
}
