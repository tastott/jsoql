///<reference path="Scripts/typings/angularjs/angular.d.ts" />
///<reference path="Scripts/typings/angularjs/angular-route.d.ts" />

import appCtrl = require('./Scripts/Controllers/appController')
import qrDir = require('./Scripts/Directives/queryResult')
import qeDir = require('./Scripts/Directives/queryEditor')
import fiDir = require('./Scripts/Directives/folderInput')
import fdDir = require('./Scripts/Directives/fileDrop')
import fServ = require('./Scripts/Services/fileService')
import qServ = require('./Scripts/Services/queryStorageService')
import repo = require('./Scripts/Services/typedRepository')
import d = require('./Scripts/models/dictionary')
import m = require('./Scripts/models/models')
import cors = require('./Scripts/cors')
var jsoql = require('../Jsoql/Scripts/engine') //TODO: Replace with npm module eventually

var config = new m.Configuration(process['browser'] ? m.Environment.Online : m.Environment.Desktop);

angular.module('Jsoql', ['ngRoute', 'ui.bootstrap'])
    .constant('querySettingsRepo', new repo.LocalStorageRepository<d.Dictionary<qServ.QuerySettings>>('querySettings'))
    .constant('configuration', config)
    .factory('queryFileService',() => config.Environment == m.Environment.Desktop 
        ? new fServ.DesktopFileService('queryFileIds')
        : new fServ.OnlineFileService('queryFileIds')
    )
    .factory('dataFileService',() => config.Environment == m.Environment.Desktop
        ? new fServ.DesktopFileService('dataFileIds')
        : new fServ.OnlineFileService('dataFileIds')
    )
    .factory('jsoqlEngine',() => config.Environment == m.Environment.Desktop
        ? new jsoql.DesktopJsoqlEngine()
        : new jsoql.OnlineJsoqlEngine()
    )
    .service('queryStorageService', qServ.QueryStorageService)
    .controller('AppController', appCtrl.AppController)
    .directive('queryResult',() => new qrDir.QueryResultDirective())
    .directive('queryEditor',() => new qeDir.QueryEditorDirective())
    .directive('queryEditorAce',qeDir.AceQueryEditorDirective.Factory())
    .directive('folderInput',() => new fiDir.FolderInputDirective())
    .directive('fileDrop', () => new fdDir.FileDropDirective())
    .config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {

        $routeProvider.when('/home', {
                templateUrl: 'Views/home.html',
                controller: 'AppController'
            })
            .otherwise({
                redirectTo: '/home'
            });

    }]);


