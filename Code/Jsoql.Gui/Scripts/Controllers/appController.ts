///<reference path="../typings/jsoql/jsoql.d.ts" />
///<reference path="../models/models.ts"/>

var Jsoql: JsoqlStatic = require('../../../Jsoql/jsoql') //TODO: Replace with npm module eventually

interface appScope extends angular.IScope {
    QueryText: string;
    QueryResult: QueryResult;
    Execute: () => void; 
}

export class AppController {
    constructor(private $scope: appScope) {
        $scope.QueryText = window.localStorage.getItem("LastQuery") || '';
        $scope.Execute = this.Execute;
        $scope.QueryResult = {};

        $scope.$watch('QueryText',(newValue: string, oldValue: string) => {
            window.localStorage.setItem("LastQuery", newValue);
        });
    }

    Execute = () => {
        if (this.$scope.QueryText) {
            Jsoql.ExecuteQuery(this.$scope.QueryText)
                .then(result => {
                    this.$scope.$apply(() => this.$scope.QueryResult = result); //TOOD: Better way to do this?
                });
        }
    }
}