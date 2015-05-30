document = window.document;
var brace = require('brace')
var Range = brace.acequire('ace/range').Range;

export function GetLineToHere(session: AceAjax.IEditSession, pos: AceAjax.Position): string {
    var lineToHereRange = new Range(pos.row, 0, pos.row, pos.column);
    return session.getTextRange(lineToHereRange);
}
