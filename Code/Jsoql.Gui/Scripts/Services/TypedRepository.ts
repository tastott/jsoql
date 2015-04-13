export interface TypedRepository<T> {
    Put(item: T);
    Get(): T;
}

export class LocalStorageRepository<T> implements TypedRepository<T>{

    constructor(private storageKey: string) {}

    Put(item: T) {
        var json = item ? JSON.stringify(item) : null;
        window.localStorage.setItem(this.storageKey, json);
    }

    Get(): T{
        var json = window.localStorage.getItem(this.storageKey);
        if (json) return JSON.parse(json);
        else return null;
    }
}