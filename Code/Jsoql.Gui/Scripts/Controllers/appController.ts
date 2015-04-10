interface appScope extends angular.IScope {
    QueryText: string;
    Execute: () => void; 
}

export class AppController {
    constructor(private $scope: appScope) {
        $scope.QueryText = '';
        $scope.Execute = this.Execute;
    }

    Execute = () => {
        console.log(this.$scope.QueryText);
    }
}