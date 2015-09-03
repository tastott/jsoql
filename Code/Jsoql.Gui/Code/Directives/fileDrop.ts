import $ = require('jquery')
import m = require('../models/models')

export interface FileDropScope {
    onDrop: (file: any) => void;
}

export class FileDropDirective implements ng.IDirective {

    public scope = {
        onDrop: '='
    }

    public link($scope: FileDropScope, element: JQuery, attributes: ng.IAttributes) {

        element.on(
            'dragover',
            function (e) {
                e.preventDefault();
                e.stopPropagation();
            }
        )
        element.on(
            'dragenter',
            function (e) {
                e.preventDefault();
                e.stopPropagation();
            }
        )

        element.on(
            'drop',
            function (e) {
                var dataTransfer: any = (<any>e).dataTransfer;
                if (dataTransfer) {
                    if (dataTransfer.files.length) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if ($scope.onDrop) $scope.onDrop(dataTransfer.files[0]);
                    }
                }
            }
        );
    }
}