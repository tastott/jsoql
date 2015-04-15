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

        $scope.Folder = $scope.Folder || new m.EditableText('');

        var fileInput = $(element).find("input[type='file']")
            .change(function (event) {
                if (this.files && this.files.length) $scope.Folder.SetValue(this.files[0].path);
                else $scope.Folder.SetValue('');
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