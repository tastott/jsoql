///<reference path="typings/node/node.d.ts"/>

module Jsoql {
    export module QueryString {

        var lazy: LazyJS.LazyStatic = require('lazy.js')

        export function Parse(value: string): any {
            if (!value) return {};
            var pairs = value.split('&');

            return lazy(pairs)
                .map(pair => pair.split('='))
                .toObject();
        }
    }
}