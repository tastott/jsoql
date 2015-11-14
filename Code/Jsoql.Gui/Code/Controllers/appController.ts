
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
        this.BaseDirectory = new m.EditableText(BaseDirectory || process.cwd());

        this.QueryResults = [];
    }

    CurrentQuery: qes.QueryResult;
    QueryText: m.EditableText;
    BaseDirectory: m.EditableText;
    StorageId: string;
    IsExecuting = () => {
        return this.CurrentQuery && this.CurrentQuery.Iterator && !this.CurrentQuery.Iterator.IsComplete();
    }

    QueryResults: any[];
    Error: string;

    IsEdited = () => {
        return !this.StorageId || this.QueryText.IsEdited() || this.BaseDirectory.IsEdited();
    }

    DisplayName = () => {
        return this.name;// + (this.IsEdited() ? ' *' : ''); IsEdited logic not working yet
    }

    private ClearResults() {
        this.QueryResults = [];
        this.Error = null;

        if (this.CurrentQuery && this.CurrentQuery.Iterator) {
            this.CurrentQuery.Iterator.Cancel(true);
        }

        this.CurrentQuery = null;
    }

    Execute = () => {
        if (this.QueryText.GetValue()) {
           
            this.ClearResults();
            //this.IsExecuting = true;

            this.CurrentQuery = this.queryExecutionService.ExecuteQuery(this.QueryText.GetValue(), this.BaseDirectory.GetValue());
            if (this.CurrentQuery.Errors && this.CurrentQuery.Errors.length) {
                this.Error = this.CurrentQuery.Errors[0];
            }
            else {
                this.GetMoreResults();
                this.CurrentQuery.Iterator.OnError(error => {
                    this.Error = error;
                    this.QueryResults = [];
                    this.CurrentQuery = null;
                });

            }

           
            //this.queryExecutionService.ExecuteQuery(this.QueryText.GetValue(), this.BaseDirectory.GetValue())
            //    .then(result => {
            //        this.$scope.$apply(() => this.QueryResult = result); //TOOD: Better way to do this?
            //    })
            //    .fail(error => {
            //        this.$scope.$apply(() => this.QueryResult = { Errors: [error] });
            //    })
            //    .finally(() => {
            //        this.$scope.$apply(() => this.IsExecuting = false);
            //    });
        }
    }

    GetMoreResults = () => {
        console.log('getting more');
        if (this.CurrentQuery && this.CurrentQuery.Iterator) {
            return this.CurrentQuery.Iterator.GetNext(8)
                .then(items => {
                    this.$scope.$apply(() => this.QueryResults = this.QueryResults.concat(items));
                    return items.length == 0; //return true to indicate completion
                });
        }
        else return Q(true); //return true to indicate completion
    }

    Cancel = () => {
        if (this.CurrentQuery && this.CurrentQuery.Iterator && !this.CurrentQuery.Iterator.IsComplete()) {
            this.ClearResults();
        }
    }

    QueryShareLink = () => {
        if (this.QueryText.GetValue()) {
            return window.location.protocol + '//' + `${window.location.host}${window.location.pathname}#/home?queryText=${encodeURIComponent(this.QueryText.GetValue()) }&executeNow=true`;
        } else return "";
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
            this.CurrentQuery.GetAll()
                .then(results => {
                    var json = JSON.stringify(results, null, 4);

                    return this.queryFileService.Download(json, 'results.json')
                        .fail(error => {
                        console.log(error);
                    })
                        .then(() => {
                        console.log('file saved');
                    });
                });
            }
    }

    SaveResultsEnabled = () => {
        return this.CurrentQuery && this.CurrentQuery.Iterator && this.CurrentQuery.Iterator.IsComplete();
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
    CanShareQuery(): boolean;
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
        $scope.CanShareQuery = () => configuration.IsOnline();

        //For demo purposes, the URL can contain some initial query text
        //If so, don't bother loading any other tabs
        if ($routeParams['queryText']) {
            var tab = this.CreateTab('query', null, $routeParams['queryText'], $routeParams['baseDirectory']);

            this.AddTab(tab);
            $scope.SelectedTab = tab;

            if ($routeParams['executeNow'] && $routeParams['executeNow'].toLowerCase() === 'true') {
                $scope.SelectedTab.Execute();
            }
        }
        else {
            this.GetInitialTabs()
                .then(tabs => {
                    $scope.$apply(() => 
                        {if (!tabs || !tabs.length) this.AddTab();
                        else tabs.forEach(tab => this.AddTab(tab));
                        $scope.SelectedTab = $scope.Tabs[0];
                    }) 
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

var someDummyData = [
    {
        "Order": {
            "Id": 11074,
            "CustomerId": "SIMOB",
            "EmployeeId": 7,
            "OrderDate": "\/Date(894412800000-0000)\/",
            "RequiredDate": "\/Date(896832000000-0000)\/",
            "ShipVia": 2,
            "Freight": 18.44,
            "ShipName": "Simons bistro",
            "ShipAddress": "Vinbæltet 34",
            "ShipCity": "Kobenhavn",
            "ShipPostalCode": "1734",
            "ShipCountry": "Denmark"
        },
        "OrderDetails": [
            {
                "OrderId": 11074,
                "ProductId": 16,
                "UnitPrice": 17.45,
                "Quantity": 14,
                "Discount": 0.05
            }
        ]
    },
    {
        "Order": {
            "Id": 11075,
            "CustomerId": "RICSU",
            "EmployeeId": 8,
            "OrderDate": "\/Date(894412800000-0000)\/",
            "RequiredDate": "\/Date(896832000000-0000)\/",
            "ShipVia": 2,
            "Freight": 6.19,
            "ShipName": "Richter Supermarkt",
            "ShipAddress": "Starenweg 5",
            "ShipCity": "Genève",
            "ShipPostalCode": "1204",
            "ShipCountry": "Switzerland"
        },
        "OrderDetails": [
            {
                "OrderId": 11075,
                "ProductId": 2,
                "UnitPrice": 19,
                "Quantity": 10,
                "Discount": 0.15
            },
            {
                "OrderId": 11075,
                "ProductId": 46,
                "UnitPrice": 12,
                "Quantity": 30,
                "Discount": 0.15
            },
            {
                "OrderId": 11075,
                "ProductId": 76,
                "UnitPrice": 18,
                "Quantity": 2,
                "Discount": 0.15
            }
        ]
    },
];