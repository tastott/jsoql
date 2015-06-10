
///<reference path="../models/models.ts"/>
import Q = require('q')
import qss = require('../Services/queryStorageService')
import _fs = require('../Services/fileService')
import qes = require('../Services/queryExecutionService')
import m = require('../models/models')
import util = require('../utilities')
import path = require('path')

class QueryTab {

    constructor(private $scope: ng.IScope,
        private queryService: qss.QueryStorageService,
        private queryFileService: _fs.FileService,
        private queryExecutionService : qes.QueryExecutionService,
        private name: string,
        StorageId?: string,
        QueryText?: string,
        BaseDirectory?: string) {

        this.StorageId = StorageId || null;
        this.QueryText = new m.EditableText(QueryText || '');
        this.QueryResult = {};
        this.BaseDirectory = new m.EditableText(BaseDirectory || process.cwd());
        this.IsExecuting = false;

        this.QueryResult = {};
    }

    QueryText: m.EditableText;
    QueryResult: m.QueryResult;
    BaseDirectory: m.EditableText;
    StorageId: string;
    IsExecuting: boolean;

    IsEdited = () => {
        return !this.StorageId || this.QueryText.IsEdited() || this.BaseDirectory.IsEdited();
    }

    DisplayName = () => {
        return this.name;// + (this.IsEdited() ? ' *' : ''); IsEdited logic not working yet
    }

    Execute = () => {
        if (this.QueryText.GetValue()) {
            this.IsExecuting = true;

            this.queryExecutionService.ExecuteQuery(this.QueryText.GetValue(), this.BaseDirectory.GetValue())
                .then(result => {
                    this.$scope.$apply(() => this.QueryResult = result); //TOOD: Better way to do this?
                })
                .fail(error => {
                    this.$scope.$apply(() => this.QueryResult = { Errors: [error] });
                })
                .finally(() => {
                    this.$scope.$apply(() => this.IsExecuting = false);
                });
        }
    }

    SaveQuery = () => {
        var query: qss.SavedQuery = {
            Id: this.StorageId,
            Name: this.name,
            Query: this.QueryText.GetValue(),
            Settings: {
                BaseDirectory: this.BaseDirectory.GetValue(),
                InWorkspace: true
            }
        };

        this.queryService.Save(query)
            .then(savedFile => {
                this.$scope.$apply(() => {
                    this.StorageId = savedFile.Id;
                    this.name = savedFile.Name;
                });
            });
    }

    SaveResults = () => {
        if (this.SaveResultsEnabled()) {
            var json = JSON.stringify(this.QueryResult.Results, null, 4);

            this.queryFileService.Download(json, 'results.json')
                .fail(error => {
                    console.log(error);
                })
                .then(() => {
                    console.log('file saved');
                });
                
            }
    }

    SaveResultsEnabled = () => {
        return !!this.QueryResult && !!this.QueryResult.Results;
    }
}

interface AppScope extends angular.IScope {
    
    SelectTab(tab: QueryTab): void;
    CloseTab(tab: QueryTab): void;
    Tabs: QueryTab[];
    SelectedTab: QueryTab;
    AddTab: () => void;
    Reload: () => void;
    OnQueryFileDrop: (file: File) => void;
    Settings: {
        EditorThemes: string[];
        SelectedEditorTheme: string
    }
    LoadTab: (file: File) => void;
    Environment: string;
    SelectedMenuPanel: string;
    ToggleMenuPanel(name: string);
}

export class AppController {

    constructor(private $scope: AppScope,
        private queryFileService: _fs.FileService,
        private queryStorageService: qss.QueryStorageService,
        private dataFileService: _fs.FileService,
        private configuration: m.Configuration,
        private queryExecutionService: qes.QueryExecutionService,
        private $routeParams: any) {

        $scope.SelectTab = this.SelectTab;
        $scope.CloseTab = this.CloseTab;
        $scope.Tabs = [];
        $scope.AddTab = this.AddTab;
        $scope.Reload = this.Reload;
        $scope.OnQueryFileDrop = this.OnQueryFileDrop;
        $scope.LoadTab = this.LoadTab;
        $scope.Settings = {
            EditorThemes: ['twilight', 'ambiance'],
            SelectedEditorTheme: 'twilight'
        };
        $scope.Environment = m.Environment[configuration.Environment];
        $scope.ToggleMenuPanel = this.ToggleMenuPanel;

        //For demo purposes, the URL can contain some initial query text
        //If so, don't bother loading any other tabs
        if ($routeParams['queryText']) {
            var tab = this.CreateTab('query', null, $routeParams['queryText'], $routeParams['baseDirectory']);

            this.AddTab(tab);
            $scope.SelectedTab = tab;
        }
        else {
            this.GetInitialTabs()
                .then(tabs => {
                if (!tabs || !tabs.length) this.AddTab();
                else tabs.forEach(tab => this.AddTab(tab));
                $scope.SelectedTab = $scope.Tabs[0];
            });
        }
    }

    private CreateTab(name: string, id?: string, queryText?: string, baseDirectory?:string) : QueryTab{
        return new QueryTab(this.$scope, this.queryStorageService, this.queryFileService,
            this.queryExecutionService, name, id, queryText, baseDirectory);
    }

    ToggleMenuPanel = (name: string) => {
        if (this.$scope.SelectedMenuPanel === name) {
            this.$scope.SelectedMenuPanel = null;
        }
        else this.$scope.SelectedMenuPanel = name;
    }

    LoadTab = (file: File) => {
        //Desktop only
        if (!this.configuration.IsOnline()) {
            //Check file isn't already open
            var alreadyOpen = this.$scope.Tabs.filter(tab => tab.StorageId && tab.StorageId.toLowerCase() === file['path'].toLowerCase())[0];
            if (alreadyOpen) this.SelectTab(alreadyOpen);
            else {
                this.queryFileService.Load(file['path']).then(query => {
                    this.$scope.$apply(() => {
                        var tab = this.CreateTab(path.basename(file['path']), file['path'], query);
                        this.AddTab(tab, true);
                    });
                });
            }
        }
    }

    OnQueryFileDrop = (file: File) => {
        //NW
        if (!this.configuration.IsOnline()) {
            var folder = path.dirname(file['path']);
            var filename = path.basename(file['path']);

            //Replace empty query with SELECT *
            if (!this.$scope.SelectedTab.QueryText.Value().trim()) {
                var query = `SELECT\n\t*\nFROM\n\t'file://${filename}'`;
                this.$scope.$apply(() => {
                    this.$scope.SelectedTab.BaseDirectory.SetValue(folder);
                    this.$scope.SelectedTab.QueryText.SetValue(query);
                });
            }
            //Add FROM target only to an existing query
            else {
                var query = this.$scope.SelectedTab.QueryText.Value() + `\n'file://${file['path']}'`;
                this.$scope.$apply(() => {
                    this.$scope.SelectedTab.QueryText.SetValue(query);
                });
            }
        }
        //Online
        else {
            //Copy file to local storage
            util.ReadTextFile(file)
                .then(content => this.dataFileService.Save(content, file.name))
                .then(savedFile => {

                    //Replace empty query with SELECT *
                    if (!this.$scope.SelectedTab.QueryText.Value().trim()) {
                        var query = `SELECT\n\t*\nFROM\n\t'file://${savedFile.Name}'`;
                        this.$scope.$apply(() => {
                            this.$scope.SelectedTab.QueryText.SetValue(query);
                        });
                    }
                    //Add FROM target only to an existing query
                    else {
                        var query = this.$scope.SelectedTab.QueryText.Value() + `\n'file://${savedFile.Name}'`;
                        this.$scope.$apply(() => {
                            this.$scope.SelectedTab.QueryText.SetValue(query);
                        });
                    }

                })
                .fail(error => console.log(`Failed to read from file '${file.name}'`));
            
        }
    }

    AddTab = (tab?: QueryTab, select? : boolean) => {
        var tabToAdd = tab || this.CreateTab('new');

        this.$scope.Tabs.push(tabToAdd);
        if (!tab || select) this.SelectTab(tabToAdd);
    }

    GetInitialTabs(): Q.Promise<QueryTab[]> {
        return this.queryStorageService.GetAll()
            .then(queries => queries.map(query => 
                new QueryTab(this.$scope, this.queryStorageService,
                    this.queryFileService,
                    this.queryExecutionService,
                    query.Name, query.Id, query.Query, query.Settings.BaseDirectory)
            ));
    }

    SelectTab = (tab: QueryTab) => {
        if (tab != this.$scope.SelectedTab) {
            var index = this.$scope.Tabs.indexOf(tab);
            if (index >= 0) this.$scope.SelectedTab = tab;
        } 
    }

    CloseTab = (tab: QueryTab) => {
        this.$scope.Tabs = this.$scope.Tabs.filter(t => t != tab);
        if (tab == this.$scope.SelectedTab) this.SelectTab(this.$scope.Tabs[0]);
        this.queryStorageService.Unload(tab.StorageId);
    }

    Reload = () => {
        this.GetInitialTabs();
    }

    private GetStorageKey(scopeProperty: string): string{
        return 'AppController.' + scopeProperty + 'Latest';
    }

    private GetLatest(scopeProperty: string): any {
        var storageKey = this.GetStorageKey(scopeProperty);
        return window.localStorage.getItem(storageKey);
    }

    private StoreLatest(scopeProperty: string) {
        var storageKey = this.GetStorageKey(scopeProperty);
        this.$scope.$watch(scopeProperty,(newValue: any, oldValue: any) => {
            window.localStorage.setItem(storageKey, newValue);
        });
    }

    
}