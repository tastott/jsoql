///<reference path="../typings/jsoql/jsoql.d.ts" />
///<reference path="../models/models.ts"/>
import Q = require('q')
import qss = require('../Services/queryStorageService')
import _fs = require('../Services/fileService')
var Jsoql: JsoqlStatic = require('../../../Jsoql/jsoql') //TODO: Replace with npm module eventually
import m = require('../models/models')

class QueryTab {

    constructor(private $scope: ng.IScope,
        private queryService: qss.QueryStorageService,
        private fileService: _fs.FileService,
        private name: string,
        StorageId?: string,
        QueryText?: string,
        BaseDirectory?: string) {

        this.StorageId = StorageId || null;
        this.QueryText = new m.EditableText(QueryText || '');
        this.QueryResult = {};
        this.BaseDirectory = new m.EditableText(BaseDirectory || process.cwd());
        this.IsExecuting = false;
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
            var context: JsoqlQueryContext = {
                BaseDirectory: this.BaseDirectory.GetValue()
            };

            this.IsExecuting = true;

            Jsoql.ExecuteQuery(this.QueryText.GetValue(), context)
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

            this.fileService.Download(json, 'results.json')
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
}

export class AppController {

    constructor(private $scope: AppScope,
        private fileService: _fs.FileService,
        private queryStorageService: qss.QueryStorageService) {

        $scope.SelectTab = this.SelectTab;
        $scope.CloseTab = this.CloseTab;
        $scope.Tabs = [];
        $scope.AddTab = this.AddTab;
        $scope.Reload = this.Reload;

        this.GetInitialTabs()
            .then(tabs => {
                if (!tabs || !tabs.length) this.AddTab();
                else tabs.forEach(tab => this.AddTab(tab));
                $scope.SelectedTab = $scope.Tabs[0];
            });
        }

    AddTab = (tab?: QueryTab) => {
        tab = tab || new QueryTab(this.$scope, this.queryStorageService, this.fileService, 'new');;

        this.$scope.Tabs.push(tab);
    }

    GetInitialTabs(): Q.Promise<QueryTab[]> {
        return this.queryStorageService.GetAll()
            .then(queries => queries.map(query => 
                new QueryTab(this.$scope, this.queryStorageService, this.fileService,
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