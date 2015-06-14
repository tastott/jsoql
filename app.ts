///<reference path="Scripts/typings/angularjs/angular.d.ts" />
///<reference path="Scripts/typings/angularjs/angular-route.d.ts" />

import appCtrl = require('./Scripts/Controllers/appController')
import qrDir = require('./Scripts/Directives/queryResult')
import qeDir = require('./Scripts/Directives/queryEditor/queryEditor')
import fiDir = require('./Scripts/Directives/folderInput')
import fdbDir = require('./Scripts/Directives/fileDialogButton')
import fdDir = require('./Scripts/Directives/fileDrop')
import pjDir = require('./Scripts/Directives/prettyJson')
import fServ = require('./Scripts/Services/fileService')
import qServ = require('./Scripts/Services/queryStorageService')
import qeServ = require('./Scripts/Services/queryExecutionService')
import dshServ = require('./Scripts/Services/datasourceHistoryService')
import prefServ =require('./Scripts/Services/preferencesService')
import repo = require('./Scripts/Services/typedRepository')
import d = require('./Scripts/models/dictionary')
import m = require('./Scripts/models/models')
var jsoql = require('jsoql')

var config = new m.Configuration(process['browser'] ? m.Environment.Online : m.Environment.Desktop);

//I wish I could get this to work with dependency injection :(
var prefsRepo = new repo.JsonLocalStorageRepository<prefServ.Preferences>('preferences');
var prefsService = new prefServ.PreferencesService(prefsRepo);

angular.module('Jsoql', ['ngRoute', 'ui.bootstrap', 'angular-themer', 'infinite-scroll'])
    .constant('querySettingsRepository', new d.LocalStorageDictionary<string, qServ.QuerySettings>('querySettings'))

    .constant('datasourceHistoryService', new dshServ.DatasourceHistoryService('datasourceHistory', 10))
    .constant('configuration', config)
    .constant('prefsService', prefsService)

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
  
    .directive('queryEditorAce',qeDir.AceQueryEditorDirective.Factory())
    .directive('folderInput',() => new fiDir.FolderInputDirective())
    .directive('fileDrop',() => new fdDir.FileDropDirective())
    .directive('fileDialogButton',() => new fdbDir.FileDialogButtonDirective())
    .directive('prettyJson',() => new pjDir.PrettyJsonDirective())

    .config(['themerProvider', (themerProvider: any) => {

        var themes = [
            { key: 'dark', label: 'Dark', href: ['node_modules/bootswatch/slate/bootstrap.css', 'Content/Themes/dark.css'] },
            { key: 'light', label: 'Light', href: ['node_modules/bootstrap/dist/css/bootstrap.css','Content/Themes/light.css'] }
        ];
        themerProvider.setStyles(themes);

        var initialTheme = prefsService.Get().Theme
            ? themes.filter(theme => theme.key === prefsService.Get().Theme)[0]
            : themes[0];

        themerProvider.setSelected(initialTheme.key);
        themerProvider.addWatcher(theme => prefsService.Set(prefs => prefs.Theme = theme.key));
      
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


