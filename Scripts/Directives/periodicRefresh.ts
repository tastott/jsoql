import $ = require('jquery')

export class PeriodicRefreshDirective implements ng.IDirective {

    constructor(private $parse: ng.IParseService, private $interval : ng.IIntervalService) {
    }

    public restrict = 'A';

    public link = ($scope: ng.IScope, element: JQuery, attributes: ng.IAttributes) => {

        //var expression = this.$parse(attributes['periodicRefresh']);

        var intervalMillis = attributes['periodicRefreshInterval']
            ? parseInt(attributes['periodicRefreshInterval'])
            : 1000;

        var conditionText = attributes['periodicRefreshCondition'];
        var condition = conditionText
            ? this.$parse(conditionText)
            : null;

        var interval : ng.IPromise<any>;

        var go = () => {
            if (interval) {
                this.$interval.cancel(interval);
            }

            interval = this.$interval(() => {
                //element.html(expression($scope));
                if (condition && !condition($scope)) this.$interval.cancel(interval);
                $scope.$digest();
            }, intervalMillis, null, true);
            
        };

        if (condition) {
            if (condition($scope)) go();

            $scope.$watch(conditionText,(newValue, oldValue) => {
                if (!oldValue && newValue) go();
            });
        }

        $scope.$on('destroy',() => {
            if (interval) this.$interval.cancel(interval);
        });
    }

    public static Factory() {
        var directive = ($parse: ng.IParseService, $interval: ng.IIntervalService) => {
            return new PeriodicRefreshDirective($parse, $interval);
        };

        directive['$inject'] = ['$parse', '$interval'];

        return directive;
    }
}