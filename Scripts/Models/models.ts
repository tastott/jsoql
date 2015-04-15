export interface QueryResult {
    Results?: any[];
    Errors?: string[];
}

export class EditableText {

    private lastEditTime: Date;
    private isEdited: boolean;

    constructor(private value: string) {
        this.lastEditTime = null;
        this.isEdited = false;
        //console.log('Initializing with value: ' + value);
    }

    GetValue(): string {
        return this.value;
    }

    SetValue(value: string) {
        //console.log('Changed value from "' + this.value + '" to "' + value);
        if (value !== this.value) {
            this.value = value;
            this.lastEditTime = new Date();
            this.isEdited = true;
        }
    }

    IsEdited(): boolean {
        return this.isEdited;
    }
}