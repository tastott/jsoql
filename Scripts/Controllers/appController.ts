///<reference path="../typings/jsoql/jsoql.d.ts" />
///<reference path="../models/models.ts"/>
import Q = require('q')
import utilities = require('../utilities')
var Jsoql: JsoqlStatic = require('../../../Jsoql/jsoql') //TODO: Replace with npm module eventually

interface appScope extends angular.IScope {
    BaseDirectory: EditableText;
    QueryText: EditableText;
    QueryResult: QueryResult;
    Execute: () => void; 
    SaveResults: () => void;
    SaveResultsEnabled: () => boolean;
}

export class AppController {

    constructor(private $scope: appScope) {
        $scope.BaseDirectory = { Value: this.GetLatest('BaseDirectory.Value') || process.cwd() };
        $scope.QueryText = { Value: this.GetLatest('QueryText.Value') || '' };
        $scope.Execute = this.Execute;
        $scope.SaveResults = this.SaveResults;
        $scope.SaveResultsEnabled = this.SaveResultsEnabled;
        $scope.QueryResult = {};

        this.StoreLatest('QueryText.Value');
        this.StoreLatest('BaseDirectory.Value');
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

    Execute = () => {
        if (this.$scope.QueryText) {
            var context: JsoqlQueryContext = {
                BaseDirectory: this.$scope.BaseDirectory.Value
            };

            Jsoql.ExecuteQuery(this.$scope.QueryText.Value, context)
                .then(result => {
                    this.$scope.$apply(() => this.$scope.QueryResult = result); //TOOD: Better way to do this?
                });
        }
    }

    SaveResults = () => {
        if (this.SaveResultsEnabled()) {

            //DESKTOP-ONLY
            utilities.ShowSaveFileDialog({ InitialFilename: 'results.json' })
                .then(path => {
                    var json = JSON.stringify(this.$scope.QueryResult.Results, null, 4);
                    return Q.denodeify(require('fs').writeFile)(path, json);
                })
                .then(() => {
                    console.log('file saved');
                })
                .fail(error => {
                    console.log(error);
                })
        }
    }

    SaveResultsEnabled = () => {
        return !!this.$scope.QueryResult && !!this.$scope.QueryResult.Results;
    }
}