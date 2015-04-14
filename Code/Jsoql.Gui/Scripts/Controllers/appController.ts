///<reference path="../typings/jsoql/jsoql.d.ts" />
///<reference path="../models/models.ts"/>
import Q = require('q')
import qss = require('../Services/queryStorageService')
import _fs = require('../Services/fileService')
var Jsoql: JsoqlStatic = require('../../../Jsoql/jsoql') //TODO: Replace with npm module eventually


class QueryTab {

    private isUnsaved: boolean;

    constructor(private $scope: ng.IScope,
        private queryService: qss.QueryStorageService,
        private fileService: _fs.FileService,
        private name: string,
        StorageId?: string,
        QueryText?: string,
        BaseDirectory?: string) {

        //this.isUnsaved = !StorageId;
        this.StorageId = StorageId || null;
        this.QueryText = { Value: QueryText || '' };
        this.QueryResult = {};
        this.BaseDirectory = { Value: BaseDirectory || process.cwd() };
       
    }

    QueryText: EditableText;
    QueryResult: QueryResult;
    BaseDirectory: EditableText;
    StorageId: string;

    DisplayName = () => {
        return this.name + (this.isUnsaved ? ' *' : '');
    }

    Execute = () => {
        if (this.QueryText.Value) {
            var context: JsoqlQueryContext = {
                BaseDirectory: this.BaseDirectory.Value
            };

            Jsoql.ExecuteQuery(this.QueryText.Value, context)
                .then(result => {
                this.$scope.$apply(() => this.QueryResult = result); //TOOD: Better way to do this?
            });
        }
    }

    SaveQuery = () => {
        var query: qss.SavedQuery = {
            Id: this.StorageId,
            Name: this.name,
            Query: this.QueryText.Value,
            Settings: {
                BaseDirectory: this.BaseDirectory.Value
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