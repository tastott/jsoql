import Q = require('q')
import $ = require('jquery')

export interface SaveFileOptions {
    InitialDirectory?: string;
    InitialFilename?: string
}

export function ShowSaveFileDialog(options? : SaveFileOptions): Q.Promise<string> {
    options = options || {};
  
    var input = $('<input type="file" />')
        .appendTo('body')
        .attr('nwsaveas', options.InitialFilename || '')
        .css({
            opacity: 0,
            height: 0,
            display: "none"
        });

    if (options.InitialDirectory) input.attr('nwworkingdir', options.InitialDirectory);
     
    var deferred = Q.defer<string>();
    
    input.change(() => {
        var path = input.val();
        if (path) deferred.resolve(path);
        else deferred.reject('cancelled');

        setTimeout(() => input.remove());

    });

    input.click();

    return deferred.promise;   

}

export function ReadTextFile(file: File): Q.Promise<string> {
    var deferred = Q.defer<string>();

    var reader = new FileReader();
    reader.onload = e => deferred.resolve(e.target['result']);
    reader.onerror = e => deferred.reject(e['message']);

    reader.readAsText(file);

    return deferred.promise;
}

export function RegexMatchOrDefault(str: string, regex: RegExp, _default : string = ''): string {

    if (!str) return _default;
    var match = str.match(regex);

    return match ? match[0] : _default;

}