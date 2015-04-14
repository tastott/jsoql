///<reference path="Scripts/typings/angularjs/angular.d.ts" />
///<reference path="Scripts/typings/angularjs/angular-route.d.ts" />

import appCtrl = require('./Scripts/Controllers/appController')
import qrDir = require('./Scripts/Directives/queryResult')
import qeDir = require('./Scripts/Directives/queryEditor')
import fiDir = require('./Scripts/Directives/folderInput')
import fServ = require('./Scripts/Services/fileService')
import qServ = require('./Scripts/Services/queryStorageService')
import repo = require('./Scripts/Services/typedRepository')
import d = require('./Scripts/dictionary')

angular.module('Jsoql', ['ngRoute', 'ui.bootstrap'])
    .constant('querySettingsRepo', new repo.LocalStorageRepository<d.Dictionary<qServ.QuerySettings>>('querySettings'))
    .constant('savedQueryIdsRepo', new repo.LocalStorageRepository<d.Dictionary<string>>('queryIds'))
    .service('fileService', fServ.DesktopFileService)
    .service('queryStorageService', qServ.QueryStorageService)
    .controller('AppController', appCtrl.AppController)
    .directive('queryResult',() => new qrDir.QueryResultDirective())
    .directive('queryEditor',() => new qeDir.QueryEditorDirective())
    .directive('queryEditorAce',() => new qeDir.AceQueryEditorDirective())
    .directive('folderInput', () => new fiDir.FolderInputDirective())
    .config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {

        $routeProvider.when('/home', {
                templateUrl: 'Views/home.html',
                controller: 'AppController'
            })
            .otherwise({
                redirectTo: '/home'
            });

    }]);


