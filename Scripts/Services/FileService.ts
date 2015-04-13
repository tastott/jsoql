import Q = require('q')
import utilities = require('../utilities')
import path = require('path')
import repo = require('./typedRepository')

export interface FileSaveOptions {
    StorageId?: string;
    Extensions?: string[];
}

export interface SavedFile {
    Name: string;
    Id: string;
}

export interface FileService {
    GetAll(): SavedFile[];
    Load(id: string): Q.Promise<string>;
    Save(data: string, options : FileSaveOptions): Q.Promise<SavedFile>;
    Download(data : string, filename: string): Q.Promise<boolean>; 
}


export class DesktopFileService implements FileService {

    constructor(private savedQueryIdsRepo : repo.TypedRepository<Set<string>>) { }

    GetAll(): SavedFile[]{
        var ids = this.savedQueryIdsRepo.Get() || {};
        return Object.keys(ids).map(id => {
            return {
                Id: id,
                Name: path.basename(id)
            };
        });
    }

    Load(id: string): Q.Promise<string> {
        return <any>Q.denodeify(require('fs').readFile)(id);
    }

    Save(data : string, options : FileSaveOptions): Q.Promise<SavedFile> {
        var dialogOptions : utilities.SaveFileOptions = {};
        if (options && options.StorageId) {
            dialogOptions.InitialDirectory = path.dirname(options.StorageId);
            dialogOptions.InitialFilename = path.basename(options.StorageId);
        }

        return utilities.ShowSaveFileDialog(options)
            .then(savedPath => {
                var name = path.basename(savedPath);
                return Q.denodeify(require('fs').writeFile)(savedPath, data)
                    .then(() => {
                        var id = path.normalize(savedPath);
                        var ids = this.savedQueryIdsRepo.Get();
                        ids.add(id);

                        return {
                            Name: name,
                            Id: id
                        };
                    });
            });
    }

    Download(data: string, filename: string): Q.Promise<boolean> {
        return utilities.ShowSaveFileDialog({ InitialFilename: filename })
            .then(path => {
                return Q.denodeify(require('fs').writeFile)(path, data)
                    .then(() => true);
            });
    }

}