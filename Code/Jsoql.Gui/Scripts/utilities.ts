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
            height: 0
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
