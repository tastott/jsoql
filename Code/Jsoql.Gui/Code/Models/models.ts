export class Configuration {
    constructor(public Environment: Environment) {
    }

    IsOnline() {
        return this.Environment == Environment.Online;
    }
}

export enum Environment {
    Desktop,
    Online
}

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

    Value(newValue?: string) {
        if (newValue != undefined) this.SetValue(newValue);
        else return this.GetValue();
    }
}