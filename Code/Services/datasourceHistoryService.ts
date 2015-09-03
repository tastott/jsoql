import d = require('../Models/dictionary')
import lazy = require('lazy.js')

export class Datasource {
    Type: string;
    Value: string;
}

interface DatasourceHistoryEntry extends Datasource {
    Date: Date;
}

export class DatasourceHistoryService {

    private entries: d.IDictionary<Datasource, DatasourceHistoryEntry>;

    constructor(storageKey : string, private maxEntries : number) {
        this.entries = new d.LocalStorageDictionary<Datasource, DatasourceHistoryEntry>(storageKey);
    }

    Add(datasource: Datasource) {
        var key: Datasource = {
            Type: datasource.Type.toLowerCase(),
            Value: datasource.Value.toLowerCase()
        };

        var value: DatasourceHistoryEntry = {
            Type: datasource.Type,
            Value: datasource.Value,
            Date: new Date()
        };

        this.entries.Set(key, value);

        var excessEntries = this.maxEntries ? this.entries.Count() - this.maxEntries : 0;
        lazy(this.entries.Entries())
            .sortBy(entry => entry.Value.Date.valueOf())
            .first(excessEntries)
            .each(entry => this.entries.Remove(entry.Key));
        
    }

    GetRecent(dsType? : string, take?: number): Datasource[]{
        return lazy(this.entries.Values())
            .filter(value => !dsType || value.Type === dsType)
            .sortBy(value => value.Date.valueOf(), true)
            .first(take !== undefined ? take : Number.MAX_VALUE)
            .toArray();
    }
}