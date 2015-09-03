///<reference path="Code/typings/angularjs/angular.d.ts" />
///<reference path="Code/typings/angularjs/angular-route.d.ts" />

import appCtrl = require('./Code/Controllers/appController')
import qrDir = require('./Code/Directives/queryResult')
import qeDir = require('./Code/Directives/queryEditor/queryEditor')
import fiDir = require('./Code/Directives/folderInput')
import fdbDir = require('./Code/Directives/fileDialogButton')
import fdDir = require('./Code/Directives/fileDrop')
import pjDir = require('./Code/Directives/prettyJson')
import lsDir = require('./Code/Directives/lazyScroll')
import prDir = require('./Code/Directives/periodicRefresh')
import fServ = require('./Code/Services/fileService')
import qServ = require('./Code/Services/queryStorageService')
import qeServ = require('./Code/Services/queryExecutionService')
import dshServ = require('./Code/Services/datasourceHistoryService')
import prefServ =require('./Code/Services/preferencesService')
import repo = require('./Code/Services/typedRepository')
import d = require('./Code/models/dictionary')
import m = require('./Code/models/models')
var jsoql = require('./node_modules/jsoql/jsoql')

var config = new m.Configuration(process['browser'] ? m.Environment.Online : m.Environment.Desktop);

//I wish I could get this to work with dependency injection :(
var prefsRepo = new repo.JsonLocalStorageRepository<prefServ.Preferences>('preferences');
var prefsService = new prefServ.PreferencesService(prefsRepo);

angular.module('Jsoql', ['ngRoute', 'ui.bootstrap', 'angular-themer'])
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
    .directive('lazyScroll',lsDir.LazyScrollDirective.Factory())
    .directive('periodicRefresh', prDir.PeriodicRefreshDirective.Factory())

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


