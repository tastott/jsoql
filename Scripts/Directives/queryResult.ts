
var renderJson = require('../Vendor/renderjson');
renderJson.set_icons('', '');
renderJson.set_show_to_level(2);

export interface QueryResultScope extends ng.IScope {
    value: QueryResult;
}

export class QueryResultDirective implements ng.IDirective {

    public scope = {
        value: '='
    }

    public link($scope: QueryResultScope, element: JQuery, attributes: ng.IAttributes) {
        $scope.$watch('value',(newValue: QueryResult) => {
            element.html('');

            if (newValue) {
                if (newValue.Results && newValue.Results.length) {
                    
                    element.append(renderJson(newValue.Results));
                }
                else {
                    element.html('<div>No results</div>');
                }
            }
        });
    }
}