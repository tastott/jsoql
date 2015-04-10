///<reference path="Scripts/typings/angularjs/angular.d.ts" />
///<reference path="Scripts/typings/angularjs/angular-route.d.ts" />

import appCtrl = require('./Scripts/Controllers/appController')

angular.module('Jsoql', ['ngRoute'])
    .controller('AppController', appCtrl.AppController)
    .config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {

        $routeProvider.when('/home', {
                templateUrl: 'Views/home.html',
                controller: 'AppController'
            })
            .otherwise({
                redirectTo: '/home'
            });

    }]);