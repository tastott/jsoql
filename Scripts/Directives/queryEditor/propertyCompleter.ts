import qem = require('./models')
import qes = require('../../Services/queryExecutionService')
import qeUtil = require('./utilities')
import lazy = require('lazy.js')
import util = require('../../utilities')

export class PropertyCompleter implements qem.AceCompleter {

    constructor(private queryExecutionService: qes.QueryExecutionService,
        private getBaseDirectory: () => string) {
    }

    getCompletions(editor: AceAjax.Editor, session: AceAjax.IEditSession, pos: AceAjax.Position, prefix: string, callback) {
        var query = session.getValue();
        if (!query) callback(null, []);
        else {
            var cursor = {
                Line: pos.row,
                Column: pos.column
            };

            this.queryExecutionService.GetQueryHelp(query, cursor, this.getBaseDirectory())
                .then(helpResult => {
                if (!helpResult || !helpResult.PropertiesInScope) callback(null, []);
                else {
                    //Prefix stops at word boundaries so not much use for nested properties?
                    //Stop at whitespace instead
                    var lineToHere = qeUtil.GetLineToHere(session, pos);
                    prefix = util.RegexMatchOrDefault(lineToHere, /\S+$/);

                    if (prefix) {
                        var currentProp = util.RegexMatchOrDefault(prefix, /[^\.]+$/);

                        var parentProps = prefix.split('.').slice(0, -1);

                        //Attempt to navigate to position indicated by prefix in the scope properties object
                        var propsInScope = helpResult.PropertiesInScope;
                        for (var i = 0; i < parentProps.length; i++) {
                            var prop = parentProps[i];
                            if (propsInScope[prop] === undefined) {
                                //Parent doesn't exist, abort
                                callback(null, []);
                                return;
                            }
                            else propsInScope = propsInScope[prop];
                        }

                        var completions: qem.AceCompletion[] =
                            Object.keys(propsInScope)
                                .map(prop => {
                                return {
                                    name: prop,
                                    value: prop,
                                    score: currentProp && prop.match(currentProp) ? 101 : 100,
                                    meta: 'property'
                                };
                            });

                        callback(null, completions);
                    }
                }
            });

        }

    }

    //public insertMatch = (editor: FudgedAceEditor, completion: AceCompletion) => {

    //    var position = editor.selection.getRange().start;

    //    //Find this partial URI with a search (probably a better way to do this?)
    //    var search: AceAjax.Range = editor.find(this.uriPattern, {
    //        caseSensitive: false,
    //        range: new Range(position.row, 0, position.row + 1, 0), //Search whole row
    //        regExp: true,
    //        start: new Range(position.row, 0, position.row, 0)
    //    });
    //    editor.replace("'" + this.scheme + "://" + completion.value + "'");

    //    if (!search) throw new Error('Unable to find URI to replace');

    //    var selectionEnd = editor.selection.getRange().end;
    //    var newCursorPos: AceAjax.Position;
    //    //Move cursor outside quotes if appropriate
    //    if (this.ExitUri(completion.value)) newCursorPos = { row: selectionEnd.row, column: selectionEnd.column };
    //    //Otherwise keep cursor inside quotes
    //    else newCursorPos = { row: selectionEnd.row, column: selectionEnd.column - 1 };

    //    editor.selection.setRange(new Range(newCursorPos.row, newCursorPos.column, newCursorPos.row, newCursorPos.column), false);

    //}
}