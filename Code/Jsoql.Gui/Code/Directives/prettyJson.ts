import $ = require('jquery')

var renderJson = require('../Vendor/renderjson');
renderJson.set_icons('', '');
renderJson.set_show_to_level(2);

export class PrettyJsonDirective implements ng.IDirective {

    public scope = {
        content: '='
    }

    //public templateUrl = 'Views/Directives/folderInput.html'

    public link($scope: ng.IScope, element: JQuery, attributes: ng.IAttributes) {
        var html = renderJson($scope['content']);
        element.html('')
        element.append(html);

        //$scope.$watch('value',(newValue: string, oldValue: any[]) => {
        //    if (newValue) {
        //        if (newValue.length) {
        //            element.html('');
        //            element.append(renderJson(newValue));
        //        }
        //        else {
        //            element.html('<div>No results</div>');
        //        }
        //    }
        //});
    }
}