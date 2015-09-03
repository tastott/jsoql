export interface Serializer<T> {
    Serialize(value : T): string;
    Deserialize(str: string): T;
}

export class JsonSerializer<T> implements Serializer<T> {
    Serialize(value: T): string {
        return JSON.stringify(value);
    }
    Deserialize(str: string): T {
        return JSON.parse(str);
    }
}

export interface TypedRepository<T> {
    Put(item: T);
    Get(): T;
}

export class LocalStorageRepository<T> implements TypedRepository<T>{

    constructor(private storageKey: string, private serializer : Serializer<T>) {}

    Put(item: T) {
        var serialized = item ? this.serializer.Serialize(item) : null;
        window.localStorage.setItem(this.storageKey, serialized);
    }

    Get(): T{
        var serialized = window.localStorage.getItem(this.storageKey);
        if (serialized) return this.serializer.Deserialize(serialized);
        else return null;
    }
}

export class JsonLocalStorageRepository<T> extends LocalStorageRepository<T> {

    constructor(storageKey: string) {
        super(storageKey, new JsonSerializer<T>());
    }

}