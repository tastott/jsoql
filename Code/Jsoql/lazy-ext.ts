var lazy: LazyJS.LazyStatic = require('./Hacks/lazy.node')  

export function PromisedSequence(promise: Q.Promise<LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>>) {

    this.promise = promise;
}

PromisedSequence.prototype = new (<any>lazy).Sequence();

PromisedSequence.prototype.isAsync = function isAsync() {
    return true;
};
    
/**
* Throws an exception. You cannot manually iterate over an asynchronous
* sequence.
*
* @public
* @example
* Lazy([1, 2, 3]).async().getIterator() // throws
*/
PromisedSequence.prototype.getIterator = function getIterator() {
    throw new Error('A PromisedSequence does not support synchronous iteration.');
};
    
/**
* An asynchronous version of {@link Sequence#each}.
*
* @public
* @param {Function} fn The function to invoke asynchronously on each element in
*     the sequence one by one.
* @returns {AsyncHandle} An {@link AsyncHandle} providing the ability to
*     cancel the asynchronous iteration (by calling `cancel()`) as well as
*     supply callback(s) for when an error is encountered (`onError`) or when
*     iteration is complete (`onComplete`).
*/
PromisedSequence.prototype.each = function each(fn) {

    var cancelled = false;

    var handle = new (<any>lazy).AsyncHandle(function cancel() {
        cancelled = true;
    });


    this.promise
        .done(parent => {
            var i = 0;
            var parentHandle = parent.each(function (item) {
                try {
                    if (cancelled || fn(item, i++) === false) handle._resolve();
                }
                catch (ex) {
                    handle._reject(ex);
                }
            });
    
            if (parentHandle['onComplete']) parentHandle['onComplete'](() => handle._resolve());
            else handle._resolve();
        },
        error => {
            handle._reject(error);
        });

    return handle;
};

export function IfEmptySequence(
    parent: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
    defaultItem : any) {

    this.parent = parent;
    this.defaultItem = defaultItem;
}

IfEmptySequence.prototype = new (<any>lazy).Sequence();

IfEmptySequence.prototype.isAsync = function isAsync() {
    return this.parent.isAsync();
};

IfEmptySequence.prototype.each = function (fn) {

    var isEmpty = true;
    var i = 0;

    var handle = this.parent.each(function (item) {
        isEmpty = false;
        return fn(item, i++);
    });

    var sendDefault = (value) => {
        if (value && isEmpty) fn(this.defaultItem, 0);
        return value;
    };

    if (handle instanceof (<any>lazy).AsyncHandle) {
        return handle.then(sendDefault);
    }
    else {
        sendDefault(true);
        return handle;
    }
}

function CachedSequence(parent: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>) {
    
    this.parent = parent;
}

CachedSequence.prototype = new (<any>lazy).Sequence();

CachedSequence.prototype.each = function each(fn) {

    var items: any[] = this.items;

    if (items) {
        items.forEach(fn);
        return true;
    }
    else {

        var i = 0;
        items = [];

        var handle = this.parent.each(function (item) {
            items.push(item);
            var _continue = fn(item, i++);
            if (_continue === false) items = null;
        });

        if (handle instanceof (<any>lazy).AsyncHandle) {
            return handle
                .then(result => {
                    this.items = items;
                    return result;
                })
                //.fail(() => this.items = null);
        }
        else {
            this.items = items;
            return handle;
        }
   }

}

var anyLazy = (<any>lazy);
anyLazy.Sequence.prototype.withCaching = function () {
    return new CachedSequence(this);
}


export function MapAsyncSequence(parent: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>) {

    this.parent = parent;
}

MapAsyncSequence.prototype = new (<any>lazy).Sequence();

MapAsyncSequence.prototype.isAsync = function isAsync() {
    return true;
};
    
/**
* Throws an exception. You cannot manually iterate over an asynchronous
* sequence.
*
* @public
* @example
* Lazy([1, 2, 3]).async().getIterator() // throws
*/
MapAsyncSequence.prototype.getIterator = function getIterator() {
    throw new Error('A MapAsyncSequence does not support synchronous iteration.');
};
    
/**
* An asynchronous version of {@link Sequence#each}.
*
* @public
* @param {Function} fn The function to invoke asynchronously on each element in
*     the sequence one by one.
* @returns {AsyncHandle} An {@link AsyncHandle} providing the ability to
*     cancel the asynchronous iteration (by calling `cancel()`) as well as
*     supply callback(s) for when an error is encountered (`onError`) or when
*     iteration is complete (`onComplete`).
*/
MapAsyncSequence.prototype.each = function each(fn) {

    var cancelled = false;

    var handle = new (<any>lazy).AsyncHandle(function cancel() {
        cancelled = true;
    });


    var i = 0;
    var parentHandle = this.parent.each(function (item) {
        try {
            if (cancelled) handle._resolve();
            if(typeof item.then === 'function') {
                handle.waitFor(item);
                item.then(
                    result => {
                        if(fn(result, i++) === false) handle._resolve();
                    },
                    error => handle._reject(error)
                )
            }
            else {
                if(fn(item, i++) === false) handle._resolve();
            }
            
        }
        catch (ex) {
            handle._reject(ex);
        }
    });

    if (parentHandle['onComplete']) parentHandle['onComplete'](() => handle._resolve());
    else handle._resolve();
        

    return handle;
};

anyLazy.Sequence.prototype.mapAsync = function(fn: (item: any) => any|Q.Promise<any>){
    return new MapAsyncSequence(this.map(fn));
}