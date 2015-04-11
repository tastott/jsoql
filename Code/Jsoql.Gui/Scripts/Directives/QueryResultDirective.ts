
export interface QueryResultScope extends ng.IScope {
    value: QueryResult;
}

export class QueryResultDirective implements ng.IDirective {

    constructor() {
        console.log('inside qrd');
    }

    public scope = {
        value: '='
    }

    public link($scope: QueryResultScope, element: JQuery, attributes: ng.IAttributes) {
        $scope.$watch('value.Results',(newValue: any[], oldValue: any[]) => {
            if (newValue) {
                if (newValue.length) {
                    element.html('<div>' + JSON.stringify(newValue) + '</div>');
                }
                else {
                    element.html('<div>No results</div>');
                }
            }
        });
    }
}