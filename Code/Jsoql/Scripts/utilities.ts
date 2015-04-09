
module Jsoql {

    export module Utilities {
        export function IsArray(value: any): boolean {
            return Object.prototype.toString.call(value) === '[object Array]';
        }
    }
}