import Q = require('q')
import utilities = require('../utilities')
import path = require('path')
import repo = require('./typedRepository')
import d = require('../models/dictionary')

export interface FileSaveOptions {
    Extensions?: string[];
    InitialFilename?: string;
}

export interface SavedFile {
    Name: string;
    Id: string;
}

export interface FileService {
    GetAll(): SavedFile[];
    Load(id: string): Q.Promise<string>;
    Save(data: string, id : string): Q.Promise<SavedFile>;
    SaveAs(data: string, options: FileSaveOptions): Q.Promise<SavedFile>;
    Download(data: string, filename: string): Q.Promise<boolean>;
    GetMatches(globPattern: string): Q.Promise<string[]>;
}

export class DesktopFileService implements FileService {

    constructor(private savedQueryIdsRepo: repo.TypedRepository<d.Dictionary<string>>) {
    }

    private globPromised: (pattern: string, options: any) => Q.Promise<string[]> = <any>Q.denodeify(require('glob'));

    private IdToFileEntry(id: string): SavedFile {
        return {
            Name: path.basename(id, path.extname(id)), //File name without extension
            Id: id
        };
    }

    GetAll(): SavedFile[]{
        var ids = this.savedQueryIdsRepo.Get() || {};
        return Object.keys(ids).map(this.IdToFileEntry);
    }

    Load(id: string): Q.Promise<string> {
        return <any>Q.denodeify(require('fs').readFile)(id, 'utf8');
    }

    Save(data: string, id: string): Q.Promise<SavedFile> {
        return Q.denodeify(require('fs').writeFile)(id, data)
            .then(() => {
                var ids = this.savedQueryIdsRepo.Get() || {};
                ids[id] = id;
                this.savedQueryIdsRepo.Put(ids);

                return this.IdToFileEntry(id);
            });
    }

    SaveAs(data : string, options : FileSaveOptions): Q.Promise<SavedFile> {
        var dialogOptions : utilities.SaveFileOptions = {};
        if (options && options.InitialFilename) {
            dialogOptions.InitialFilename = options.InitialFilename;
        }

        return utilities.ShowSaveFileDialog(options)
            .then(savedPath => {
                return this.Save(data, savedPath); 
            });
    }

    Download(data: string, filename: string): Q.Promise<boolean> {
        return utilities.ShowSaveFileDialog({ InitialFilename: filename })
            .then(path => {
                return Q.denodeify(require('fs').writeFile)(path, data)
                    .then(() => true);
            });
    }

    GetMatches(globPattern: string): Q.Promise<string[]> {
        return this.globPromised(globPattern, null);
    }

}