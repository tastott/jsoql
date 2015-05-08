import m = require('../models/models')

var renderJson = require('../Vendor/renderjson');
renderJson.set_icons('', '');
renderJson.set_show_to_level(2);

export interface QueryResultScope extends ng.IScope {
    value: m.QueryResult;
}

export class QueryResultDirective implements ng.IDirective {

    public scope = {
        value: '='
    }

    public link($scope: QueryResultScope, element: JQuery, attributes: ng.IAttributes) {
        $scope.$watch('value',(newValue: m.QueryResult) => {
            element.html('');

            if (newValue) {
                if (newValue.Results && newValue.Results.length) {
                    
                    element.append(renderJson(newValue.Results));
                }
                else if (newValue.Errors && newValue.Errors.length) {
                    element.html('<div>' + newValue.Errors[0] + '</div>');
                }
                else {
                    element.html('<div>No results</div>');
                }
            }
        });
    }
}