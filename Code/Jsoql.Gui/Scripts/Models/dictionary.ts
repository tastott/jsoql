
export interface IDictionary<TKey, TValue> {
    Get(key: TKey): TValue;
    Set(key: TKey, value: TValue): void;
    Remove(key: TKey);
    Keys(): TKey[];
    Values(): TValue[];
    Entries(): {
        Key: TKey;
        Value: TValue;
    }[];
    Count(): number;
    ContainsKey(key: TKey): boolean;
}

export class Dictionary<TKey, TValue> implements IDictionary<TKey, TValue> {

    protected dict: {
        [index: string]: TValue
    }

    constructor(private keyToString: (key: TKey) => string,
        private stringToKey: (str : string) => TKey) {

        this.dict = {};
    }

    Get(key: TKey): TValue {
        var keyString = this.keyToString(key);
        return this.dict[keyString];  
    }

    Set(key: TKey, value: TValue): void {
        var keyString = this.keyToString(key);
        this.dict[keyString] = value;
    }

    Remove(key: TKey): void {
        var keyString = this.keyToString(key);
        delete this.dict[keyString];
    }

    Keys(): TKey[]{
        return Object.keys(this.dict)
            .map(str => this.stringToKey(str));
    }

    Values(): TValue[]{
        return Object.keys(this.dict)
            .map(str => this.dict[str]);
    }

    Entries(): {
        Key: TKey;
        Value: TValue;
    }[]{
        return Object.keys(this.dict)
            .map(str => {
                return {
                    Key: this.stringToKey(str),
                    Value: this.dict[str]
                }
            });
    }

    Count(): number {
        return Object.keys(this.dict).length;
    }

    ContainsKey(key: TKey): boolean {
        var keyString = this.keyToString(key);
        return this.dict[keyString] !== undefined;
    }
}

export class JsonKeyDictionary<TKey, TValue> extends Dictionary<TKey, TValue> {
    constructor() {
        super(key => JSON.stringify(key), str => JSON.parse(str));
    }
}

export class LocalStorageDictionary<TKey, TValue> extends JsonKeyDictionary<TKey, TValue> {
    constructor(private storageKey: string) {
        super();
        var json = window.localStorage.getItem(storageKey);
        if (json) this.dict = JSON.parse(json);
        else this.dict = {};
        console.log(this.dict);
    }

    protected Save() {
        var json = JSON.stringify(this.dict);
        window.localStorage.setItem(this.storageKey, json);
    }

    Set(key: TKey, value: TValue) {
        super.Set(key, value);
        this.Save();
    }

    Remove(key: TKey) {
        super.Remove(key);
        this.Save();
    }
}