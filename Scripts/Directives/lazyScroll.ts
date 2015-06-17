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

        function atBottom() {
            return (element[0].scrollTop + element[0].offsetHeight) > (element[0].scrollHeight - threshold);
        }

        function fillToBottom() {
            if ((element[0].scrollHeight - threshold) < element[0].offsetHeight) {
                //onScroll is assumed to return either a boolean or a promise for a boolean
                //where true indicates that no more items are available
                var result = onScroll($scope);
                if (result && result.then) result.then(complete => {
                    if (!complete) fillToBottom();
                });
                else if (result === false) fillToBottom();
            }
        }

        fillToBottom();

        element[0].addEventListener('scroll', event => {
            if (atBottom()) {
                onScroll($scope);
            }

            //$('#scroll-debug').html(JSON.stringify({
            //    scrollTop: element[0].scrollTop,
            //    height: element[0].offsetHeight,
            //    scrollHeight: element[0].scrollHeight,
            //    atBottom: atBottom
            //}, null, 4));
        });

        //If reset watch is provided, watch for changes and trigger fill
        if (attributes['lazyScrollReset']) {
            $scope.$watch(attributes['lazyScrollReset'],() => {
                fillToBottom();
            });
        }
    }

    public static Factory() {
        var directive = ($parse: ng.IParseService) => {
            return new LazyScrollDirective($parse);
        };

        directive['$inject'] = ['$parse'];

        return directive;
    }
}