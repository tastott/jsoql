///<reference path="Scripts/typings/angularjs/angular.d.ts" />
///<reference path="Scripts/typings/angularjs/angular-route.d.ts" />

import appCtrl = require('./Scripts/Controllers/appController')
import qrDir = require('./Scripts/Directives/queryResultDirective')

angular.module('Jsoql', ['ngRoute'])
    .controller('AppController', appCtrl.AppController)
    .directive('queryResult', () => new qrDir.QueryResultDirective())
    .config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {

        $routeProvider.when('/home', {
                templateUrl: 'Views/home.html',
                controller: 'AppController'
            })
            .otherwise({
                redirectTo: '/home'
            });

    }]);


