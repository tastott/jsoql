import Q = require('q')
import fServ = require('./fileService')
import repo = require('./typedRepository')
import d = require('../models/dictionary')

export interface QuerySettings {
    BaseDirectory: string;
    InWorkspace: boolean;
}

export interface SavedQuery {
    Id: string;
    Name: string;
    Query: string;
    Settings: QuerySettings;
}

export class QueryStorageService {

    public static QueryExtension = 'jsoql';

    constructor(private queryFileService: fServ.FileService,
        private querySettingsRepository : d.IDictionary<string, QuerySettings>) {
    }

    GetAll(): Q.Promise<SavedQuery[]> {
    
        var loadFiles = this.queryFileService.GetAll().map(entry => {
            var querySetttingsEntry = this.querySettingsRepository.Get(entry.Id);
            if (!querySetttingsEntry || !querySetttingsEntry.InWorkspace) {
                return Q(<SavedQuery>null);
            }
            else {
                return this.queryFileService.Load(entry.Id)
                    .fail(() => {
                        console.log('Failed to load file, it will be ignored:  ' + entry.Id);
                        return null;
                    })
                    .then(data => {
                        return {
                            Id: entry.Id,
                            Name: entry.Name,
                            Query: data,
                            Settings: querySetttingsEntry
                        };
                    });
                }
            });

        return Q.all(loadFiles)
            .then(loaded => loaded.filter(file => !!file));
    }

    Save(query: SavedQuery): Q.Promise<SavedQuery> {
        return (query.Id
                ? this.queryFileService.Save(query.Query, query.Id)
                : this.queryFileService.SaveAs(query.Query, { Extensions: [QueryStorageService.QueryExtension] })
            )
            .then(saved => {
                this.querySettingsRepository.Set(saved.Id, query.Settings);

                return {
                    Id: saved.Id,
                    Name: saved.Name,
                    Query: query.Query,
                    Settings: query.Settings
                };
            });
    }

    Unload(id : string) {
        this.querySettingsRepository.Remove(id);
    }
}