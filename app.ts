///<reference path="Scripts/typings/angularjs/angular.d.ts" />
///<reference path="Scripts/typings/angularjs/angular-route.d.ts" />

import appCtrl = require('./Scripts/Controllers/appController')
import qrDir = require('./Scripts/Directives/queryResult')
import qeDir = require('./Scripts/Directives/queryEditor/queryEditor')
import fiDir = require('./Scripts/Directives/folderInput')
import fdbDir = require('./Scripts/Directives/fileDialogButton')
import fdDir = require('./Scripts/Directives/fileDrop')
import fServ = require('./Scripts/Services/fileService')
import qServ = require('./Scripts/Services/queryStorageService')
import qeServ = require('./Scripts/Services/queryExecutionService')
import dshServ = require('./Scripts/Services/datasourceHistoryService')
import repo = require('./Scripts/Services/typedRepository')
import d = require('./Scripts/models/dictionary')
import m = require('./Scripts/models/models')
var jsoql = require('jsoql')

var config = new m.Configuration( process['browser'] ? m.Environment.Online : m.Environment.Desktop);

angular.module('Jsoql', ['ngRoute', 'ui.bootstrap', 'angular-themer'])
    .constant('querySettingsRepository', new d.LocalStorageDictionary<string, qServ.QuerySettings>('querySettings'))
    .constant('datasourceHistoryService', new dshServ.DatasourceHistoryService('datasourceHistory', 10))
    .constant('configuration', config)
    .factory('queryFileService',() => config.Environment == m.Environment.Desktop 
        ? new fServ.DesktopFileService('queryFileIds')
        : new fServ.OnlineFileService('queryFileIds')
    )
    .factory('dataFileService',() => config.Environment == m.Environment.Desktop
        ? new fServ.DesktopFileService('dataFileIds')
        : new fServ.OnlineFileService('dataFileIds')
    )
    .factory('jsoqlEngine',(dataFileService : fServ.FileService) => config.Environment == m.Environment.Desktop
        ? new jsoql.DesktopJsoqlEngine()
        : new jsoql.OnlineJsoqlEngine(
            location.hostname + (location.port ? ':' + location.port : '') + location.pathname,
            fileId => dataFileService.LoadSync(fileId)
        )
    )
    .service('queryStorageService', qServ.QueryStorageService)
    .service('queryExecutionService', qeServ.QueryExecutionService)
    .controller('AppController', appCtrl.AppController)
    .directive('queryResult',() => new qrDir.QueryResultDirective())
    .directive('queryEditor',() => new qeDir.QueryEditorDirective())
    .directive('queryEditorAce',qeDir.AceQueryEditorDirective.Factory())
    .directive('folderInput',() => new fiDir.FolderInputDirective())
    .directive('fileDrop',() => new fdDir.FileDropDirective())
    .directive('fileDialogButton',() => new fdbDir.FileDialogButtonDirective())
    .directive('wank',() => {
        console.log('wank-a-doodle-doo');
        return {};
    })
    .config(['themerProvider', function (themerProvider) {
        var styles = [
            { key: 'dark', label: 'Dark', href: ['node_modules/bootswatch/slate/bootstrap.css', 'Content/Themes/dark.css'] },
            { key: 'light', label: 'Light', href: ['node_modules/bootstrap/dist/css/bootstrap.css','Content/Themes/light.css'] }
        ];
        themerProvider.setStyles(styles);
        themerProvider.setSelected(styles[0].key);
    }])

    .config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {

        $routeProvider.when('/home', {
                templateUrl: 'Views/home.html',
                controller: 'AppController'
            })
            .otherwise({
                redirectTo: '/home'
            });

    }]);


