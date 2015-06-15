import $ = require('jquery')

export class LazyScrollDirective implements ng.IDirective {

    constructor(private $parse: ng.IParseService) {
    }

    public restrict = 'A';

    public link = ($scope: ng.IScope, element: JQuery, attributes: ng.IAttributes) => {
  
        var onScroll = this.$parse(attributes['lazyScroll']);

        var threshold = attributes['lazyScrollThreshold']
            ? parseInt(attributes['lazyScrollThreshold'])
            : 10;

        element[0].addEventListener('scroll', event => {
            var atBottom = (element[0].scrollTop + element[0].offsetHeight) > (element[0].scrollHeight - threshold);

            if (atBottom) onScroll($scope);
        });
    }

    public static Factory() {
        var directive = ($parse: ng.IParseService) => {
            return new LazyScrollDirective($parse);
        };

        directive['$inject'] = ['$parse'];

        return directive;
    }
}