
export interface AceCompletion {
    name: string;
    value: string;
    score: number;
    meta: string;
    completer?: {
        insertMatch(editor, data): void;
    }
}

export interface AceCompleter {
    getCompletions(editor: AceAjax.Editor, session:
        AceAjax.IEditSession,
        pos: AceAjax.Position,
        prefix: string,
        callback: (something: any, completions: AceCompletion[]) => void): void;
}

export interface FudgedAceEditor extends AceAjax.Editor {
    completer: {
        completions: {
            filterText: string;
        }
    }
}