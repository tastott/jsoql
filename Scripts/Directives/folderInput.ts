import $ = require('jquery')
import m = require('../models/models')

export interface FolderInputScope extends ng.IScope {
    Folder: m.EditableText;
    browse(): void;
}

export class FolderInputDirective implements ng.IDirective {

    public scope = {
        Folder: '=value'
    }

    public templateUrl = 'Views/Directives/folderInput.html'

    public link($scope: FolderInputScope, element: JQuery, attributes: ng.IAttributes) {

        var fileInput = $(element).find("input[type='file']")
            .change(function (event) {
                if ($scope.Folder) $scope.$apply(() => $scope.Folder.Value($(this).val()));
            });

        $scope.browse = () => {
            fileInput.click();
        };

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