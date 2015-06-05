import $ = require('jquery')
import m = require('../models/models')

export interface FileDialogButtonScope extends ng.IScope {
    FileAction: (file: File) => void;
}

export class FileDialogButtonDirective implements ng.IDirective {

    public scope = {
        FileAction: '=fileAction'
    }

    //public templateUrl = 'Views/Directives/folderInput.html'

    public link($scope: FileDialogButtonScope, element: JQuery, attributes: ng.IAttributes) {
        var hiddenInput = $('<input type="file" style="opacity: 0; height:0"/>').appendTo('body');
        hiddenInput.change(event => {
            if (event.target['files'] && $scope.FileAction) {
                $scope.FileAction(event.target['files'][0]);
            }
            hiddenInput.val('');
        });

        $(element).click(() => {
            hiddenInput.click();
           
        });

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