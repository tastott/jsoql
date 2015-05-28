var lazy: LazyJS.LazyStatic = require('./Hacks/lazy.node')

export function Parse(value: string): any {
    if (!value) return {};
    var pairs = value.split('&');

    return lazy(pairs)
        .map(pair => pair.split('='))
        .toObject();
}