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
}

export class BaseFileService {
    protected files: d.IDictionary<string, SavedFile>;

    constructor(serviceId: string) {
        this.files = new d.LocalStorageDictionary<string, SavedFile>(serviceId)
    }

    protected IdToFileEntry(id: string): SavedFile {
        throw new Error("Abstract method");
    }

    protected AddFileEntry(id: string) : SavedFile{
        var entry = this.IdToFileEntry(id);
        this.files.Set(id, entry);
        return entry;
    }

    GetAll(): SavedFile[] {
        return this.files.Values();
    }
}

export class OnlineFileService extends BaseFileService implements FileService {

    constructor(private serviceId: string) {
        super(serviceId);
    }

    protected IdToFileEntry(id: string): SavedFile {
        return {
            Name: id, //File name and id are identical
            Id: id
        };
    }

    Load(id: string): Q.Promise<string> {
        var content = localStorage.getItem(this.serviceId + ":content:" + id);
        return Q(content);
    }

    Save(data: string, id: string): Q.Promise<SavedFile> {
        localStorage.setItem(this.serviceId + ":content:" + id, data);
        var entry = super.AddFileEntry(id);
        return Q(entry);
    }

    SaveAs(data: string, options: FileSaveOptions): Q.Promise<SavedFile> {
        throw new Error("Not implemented in Online version");
    }

    Download(data: string, filename: string): Q.Promise<boolean> {
        throw new Error("Not implemented yet");
    }
}

export class DesktopFileService extends BaseFileService implements FileService {

    constructor(serviceId: string) {
        super(serviceId);
    }

    protected IdToFileEntry(id: string): SavedFile {
        return {
            Name: path.basename(id, path.extname(id)), //File name without extension
            Id: id
        };
    }

    Load(id: string): Q.Promise<string> {
        return <any>Q.denodeify(require('fs').readFile)(id, 'utf8');
    }

    Save(data: string, id: string): Q.Promise<SavedFile> {
        return Q.denodeify(require('fs').writeFile)(id, data)
            .then(() => super.AddFileEntry(id));
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
}
