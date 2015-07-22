var lazy: LazyJS.LazyStatic = require('./Hacks/lazy.node')
import lazyExt = require('./lazy-ext')
import Q = require('q')
import ds = require('./datasource')
import parse = require('./parse')
import m = require('./models')
import qstring = require('./query-string')
import util = require('./utilities')
import evl = require('./evaluate')
import val = require('./validate')
var clone = require('clone')
var merge = require('merge')

var hrtime: (start?: number[]) => number[] = require('browser-process-hrtime')

interface DatasourceConfig {
    Target: any;
    Alias: string;
    Parameters?: any;
    Condition?: any;
    Over?: boolean; 
    SubQuery?: boolean;
    Join?: string;
}

interface Join {
    Type: string;
    Left: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>;
    Right: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>;
    Condition: any;
    RightAlias: string;
}


class LazyJsQueryIterator implements m.QueryIterator {

    private currentIndex: number;
    private items: any[];
    private onCancel: () => void;
    private itemCallbacks: {
        Count?: number;
        Resolve: (items: any[]) => void;
        Reject: (err: any) => void;
    }[];
    private onComplete: util.CallbackSet<any>;
    private onError: util.CallbackSet<any>;
    private isComplete: boolean;
    private startTime: number[];
    private finishTime: number[];


    constructor(sequencePromise: Q.Promise<LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>>)
    {
        this.currentIndex = 0;
        this.items = [];
        this.itemCallbacks = [];
        this.isComplete = false;
        this.onComplete = new util.CallbackSet<any>();
        this.onError = new util.CallbackSet<any>();
        this.startTime = hrtime();

        sequencePromise
            .then(seq => {
                var handle = seq.each(item => this.AddItem(item));
                if (handle && handle['cancel']) {
                    this.onCancel = () => handle['cancel']();
                    handle['onComplete'](() => this.SetComplete());
                    handle['onError'](err => this.HandleError(err));
                }
                else this.SetComplete();
            })
            .fail(err => this.onError.DoAll(err))
 
    }

    Cancel(removeCallbacks?: boolean): void {
        if (this.onCancel) this.onCancel();
        this.itemCallbacks = [];
        this.onComplete.RemoveAll();
        this.onError.RemoveAll();
    }

    GetAll(): Q.Promise<any[]> {
        var deferred = Q.defer<any[]>();

        this.OnError(error => deferred.reject(error));

        this.OnComplete(() => deferred.resolve(this.items));

        return deferred.promise;
    }

    GetNext(count: number): Q.Promise<any[]> {
        var deferred = Q.defer<any[]>();

        this.itemCallbacks.push({
            Count: count,
            Resolve: deferred.resolve,
            Reject: deferred.reject
        });

        this.ProcessCallbacks();

        return deferred.promise;
    }

    AvailableItems(): number {
        return this.items.length;
    }

    ExecutionTime(): number {
        if (!this.startTime) return 0;

        var execTime = this.finishTime
            ? this.finishTime
            : hrtime(this.startTime);

        return (execTime[0] * 1000) + (execTime[1] / 1000000);
    }

    OnComplete(handler: () => void) {
        if (this.isComplete) setTimeout(handler);
        else this.onComplete.Add(handler);

        return this;
    }

    IsComplete(): boolean {
        return this.isComplete;
    }

    OnError(handler: (error: any) => void) {
        this.onError.Add(handler);

        return this;
    }

    private HandleError(error: any) {
        this.onError.DoAll(error);
        this.itemCallbacks.forEach(c => c.Reject(error));
        this.itemCallbacks = [];
        this.SetComplete();
    }


    private SetComplete() {
        this.finishTime = hrtime(this.startTime);
        this.isComplete = true;

        this.ProcessCallbacks();

        this.onComplete.DoAll(null);
    }

    private AddItem(item: any) {
        this.items.push(item);

        this.ProcessCallbacks();
    }

    private ProcessCallbacks() {
        setTimeout(() => {
            if (this.itemCallbacks.length) {
                if (this.itemCallbacks[0].Count && this.items.length >= this.currentIndex + this.itemCallbacks[0].Count) {
                    var callback = this.itemCallbacks.shift();
                    var chunk = this.GetChunk(callback.Count);
                    callback.Resolve(chunk);
                    this.ProcessCallbacks();
                }
                else if (this.isComplete) {
                    var callback = this.itemCallbacks.shift();
                    var chunk = this.GetChunk(callback.Count);
                    callback.Resolve(chunk);
                    this.ProcessCallbacks();
                }
            }
        });
    }

    private GetChunk(count?: number): any[]{
        var chunk = this.items.slice(this.currentIndex, count ? this.currentIndex + count : undefined);
        this.currentIndex += chunk.length;
        return chunk;
    }
}

export class JsoqlQueryResult implements m.QueryResult {
    constructor(public Iterator: m.QueryIterator,
        public Datasources: m.Datasource[],
        public Errors: string[]) { }

    GetAll(): Q.Promise < any[] > {

        if(this.Errors && this.Errors.length) return Q.reject<any[]>(this.Errors[0]);
        else return this.Iterator.GetAll();

    }
}

export class JsoqlQuery {

    private static UriRegex = new RegExp('^([A-Za-z]+)://(.+)$', 'i');
    private queryContext: m.QueryContext;

    constructor(private stmt: m.Statement,
        private dataSourceSequencers : ds.DataSourceSequencers,
        queryContext?: m.QueryContext) {

        this.queryContext = queryContext || {};

        this.queryContext.BaseDirectory = this.queryContext.BaseDirectory || process.cwd();
        this.queryContext.Data = this.queryContext.Data || {};
    }

    private ParseKeyValuesDatasource(keyValues: m.KeyValue[]): { Uri: string; Parameters: any; } {
        var evaluatedKeyValues = lazy(keyValues)
            .map(kv => {
            return {
                Key: kv.Key,
                Value: evl.Evaluator.Evaluate(kv.Value, null)
            };
        });
        var uri = evaluatedKeyValues.find(kv => kv.Key === 'uri');
        if (!uri) throw new Error("Datasource is missing the 'uri' property.");

        var parameters = evaluatedKeyValues
            .filter(kv => kv.Key !== 'uri')
            .map(kv => [kv.Key, kv.Value])
            .toObject();

        return {
            Uri: uri.Value,
            Parameters: parameters
        };

    }
    private ParseUri(uri: string): { Schema: string; Value: string; } {
        var match = uri.match(JsoqlQuery.UriRegex);
        var match = uri.match(JsoqlQuery.UriRegex);
        if (!match) throw new Error(`Unrecognized format for datasource: ${uri}`);

        return {
            Schema: match[1],
            Value: match[2]
        };
    }

    private GetSequence(uri: string, parameters: any, onError: m.ErrorHandler): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>{
        var parsed = this.ParseUri(uri);
        
        if (!this.dataSourceSequencers[parsed.Schema]) throw new Error(`Unrecognized schema for datasource: ${parsed.Schema}`);

        return this.dataSourceSequencers[parsed.Schema].Get(parsed.Value, parameters, this.queryContext, onError);
    }

    private FromLeaf(fromClause: m.FromClauseNode, onError: m.ErrorHandler,
        evaluator: evl.Evaluator): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        var seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>;

        //Sub-query
        if (fromClause.SubQuery) {
            var subQuery = new JsoqlQuery(fromClause.SubQuery, this.dataSourceSequencers, this.queryContext);
            seq = new lazyExt.PromisedSequence(subQuery.GetResultsSequence());
        }
        //Object literal (uri + parameters)
        else if (fromClause.KeyValues) {
            var parsed = this.ParseKeyValuesDatasource(fromClause.KeyValues);

            seq = this.GetSequence(parsed.Uri, parsed.Parameters, onError);
        }
        //Quoted (uri shorthand)
        else if (typeof fromClause.Target === 'string') {
            seq = this.GetSequence(fromClause.Target, {}, onError);
        }
        //Unquoted (i.e. some variable in context)
        else {

            seq = this.dataSourceSequencers['var'].Get(fromClause.Target, {}, this.queryContext, onError);
        }

        if (fromClause.Alias) {
            seq = seq.map(item => {
                var mapped = {};
                mapped[fromClause.Alias] = item;
                return mapped;
            });
        }

        return seq;
    }

    private From(fromClause: m.FromClauseNode, onError: m.ErrorHandler,
        evaluator : evl.Evaluator): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        //Join operation
        if (fromClause.Join) {

            var left = this.From(fromClause.Join.Left, onError, evaluator);
            var right = this.From(fromClause.Join.Right, onError, evaluator);

            return this.Join(fromClause.Join.Type, left, right, fromClause.Join.Condition, evaluator);
        }
        //Over operation
        else if (fromClause.Over) {
            var left = this.From(fromClause.Over.Left, onError, evaluator);

            return this.Over(left, fromClause.Over.Right, fromClause.Over.Alias, evaluator);
        }
        //Leaf
        else {
            return this.FromLeaf(fromClause, onError, evaluator);
        }
    }

    private Over(left: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
        childExpression : any,
        childAlias: string,
        evaluator : evl.Evaluator): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        return left.map(li => {
            var children = evaluator.Evaluate(childExpression, li) || [];
            return children.map(child => {
                var merged = clone(li);
                merged[childAlias] = child;
                return merged;
            });
        })
        .flatten();

    }

    private Join(type: string,
        left: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
        right: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
        condition : any,
        evaluator: evl.Evaluator): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        var seqA = type === 'Right' ? right : left;
        var seqB = type === 'Right' ? left : right;
     
        //We'll be doing full passes of sequence B so use cache if specified
        if (this.queryContext.UseCache) {
            seqB = seqB.withCaching();
        }

        //For each item in sequence A, find 0 to many matching items in sequence B, 
        //using the ON expression or matching all items for a CROSS join
        var joinedSeq = seqA.map(li => {

            //We'll keep track of whether one or more matches is found in the B sequence (for outer joins)
            var hasMatches = false;

            var matches = seqB.map(ri => {
                //Create prospective merged item containing left and right side items
                var merged = merge(true, li, ri);

                //Return non-null value to indicate match
                if (type == 'Cross') return merged;
                else if (evaluator.Evaluate(condition, merged)) {
                    hasMatches = true;
                    return merged;
                }
                else return null;
            })
            .compact(); //Throw away null (non-matching) values

            //For outer joins, wrap in a sequence which sends a default value if the source sequence is empty (i.e. no matches in sequence B)
            if (type === 'Left' || type === 'Right' || type == 'Full') {
                var defaultValue = li;
                //TODO: We don't know the alias of the unmatched table any more, so can't set it to null?
                //defaultValue[join.RightAlias] = null;

                ////This relies on lazy evaluation of the filter predicate after matches have been sought in sequence B
                //var defaultValueSequence = lazy([defaultValue])
                //    .async(0)
                //    .filter(x => !hasMatches)
                //    .map(x => {
                //        return x;
                //    });

                //matches = matches.concat(<any>defaultValueSequence);

                matches = new lazyExt.IfEmptySequence(matches, defaultValue);
            }

            return matches;
        })
        .flatten(); //Flatten the sequence of sequences

        //For full joins, concatenate unmatched items for sequence B
        if (type == 'Full') {
            joinedSeq = joinedSeq.concat(
                <any>seqB.filter(b =>
                    !seqA.some(a => {
                        //Create prospective merged item containing left and right side items
                        var merged = merge(true, a, b);
                        return evaluator.Evaluate(condition, merged);
                    })
                )
            );
        }

        return joinedSeq;
    }

    private Where(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>, whereClause: any, evaluator: evl.Evaluator): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>{
        return seq.filter(item => {
            return evaluator.Evaluate(this.stmt.Where, item);
        })
    }

    private SelectGrouped(groups: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
        having: any,
        evaluator: evl.Evaluator): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>{

        if (having) {
            groups = groups.filter(group => evaluator.EvaluateGroup(having, group));
        }


        lazy(this.stmt.OrderBy || []).reverse().each(orderByExp => {
            groups = groups.sortBy(group => evaluator.EvaluateGroup(orderByExp.Expression, group), !orderByExp.Asc);
        });

        return groups.map(group =>
            lazy(this.stmt.Select.SelectList)
                .map(selectable => [
                selectable.Alias || evl.Evaluator.Alias(selectable.Expression),
                evaluator.EvaluateGroup(selectable.Expression, group)
            ])
                .toObject()
            )
            .first(this.stmt.Select.Limit || Number.MAX_VALUE);
    }
    private SelectMonoGroup(items: any[], evaluator: evl.Evaluator): any[] {
        
        var group: m.Group = {
            Key: {},
            Items: items
        };

        return [
            lazy(this.stmt.Select.SelectList)
                .map(selectable => [
                selectable.Alias || evl.Evaluator.Alias(selectable.Expression),
                evaluator.EvaluateGroup(selectable.Expression, group)
            ])
            .toObject()
        ];
    }

    private SelectUngrouped(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
        evaluator: evl.Evaluator): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>{
        lazy(this.stmt.OrderBy || []).reverse().each(orderByExp => {
            seq = seq.sortBy(item => evaluator.Evaluate(orderByExp.Expression, item), !orderByExp.Asc);
        });

        //Select
        return seq
            .first(this.stmt.Select.Limit || Number.MAX_VALUE)
            .map(item => {
            return lazy(this.stmt.Select.SelectList)
                .map(selectable =>
                    evaluator.EvaluateAliased(selectable.Expression, item)
                        .map(aliasValue => {
                        return {
                            Alias: selectable.Alias || aliasValue.Alias,
                            Value: aliasValue.Value
                        };
                    })
                )
                .flatten()
                .map((aliasValue: any) => [aliasValue.Alias, aliasValue.Value])
                .toObject();
        });
    }


    ExecuteSync(): any[]{
        var evaluator = new evl.Evaluator(this.dataSourceSequencers); 

        //From
        var seq = this.From(this.stmt.From,() => { }, evaluator);

        //Where
        if (this.stmt.Where) seq = this.Where(seq, this.stmt.Where, evaluator);

        var results: any[];

        //Grouping
        //Explicitly
        if (this.stmt.GroupBy) {
            seq = this.GroupBySync(seq, this.stmt.GroupBy.Groupings, evaluator)
            seq = this.SelectGrouped(seq, this.stmt.GroupBy.Having, evaluator);
            results = JsoqlQuery.SequenceToArraySync(seq);
        }
        //Implicitly
        else if (lazy(this.stmt.Select.SelectList).some(selectable => evl.Evaluator.IsAggregate(selectable.Expression))) {

            var items = JsoqlQuery.SequenceToArraySync(seq);
            results = this.SelectMonoGroup(items, evaluator);
        }
        //No grouping
        else {
            results = JsoqlQuery.SequenceToArraySync(this.SelectUngrouped(seq, evaluator));
        }

        if (this.stmt.Union) {
            var right = new JsoqlQuery(this.stmt.Union, this.dataSourceSequencers, this.queryContext);
            return results.concat(right.ExecuteSync());
        }
        else return results;
    }

    GetDatasources(): m.Datasource[] {
        return <any>lazy(this.GetFromLeaves(this.stmt.From))
            .map(fromClause => {
                //Sub-query
                if (fromClause.SubQuery) {
                    var subQuery = new JsoqlQuery(fromClause.SubQuery, this.dataSourceSequencers, this.queryContext);
                    return subQuery.GetDatasources();
                }
                //Object literal (uri + parameters)
                else if (fromClause.KeyValues) {
                    var parsed = this.ParseKeyValuesDatasource(fromClause.KeyValues);
                    var parsedUri = this.ParseUri(parsed.Uri);

                    return [{
                        Type: parsedUri.Schema,
                        Value: parsedUri.Value
                    }];

                }
                //Quoted (uri shorthand)
                else if (typeof fromClause.Target === 'string') {
                    var parsedUri = this.ParseUri(fromClause.Target);

                    return [{
                        Type: parsedUri.Schema,
                        Value: parsedUri.Value
                    }];
                }
                //Unquoted (i.e. some variable in context)
                else return [{
                    Type: 'var',
                    Value: fromClause.Target
                }];
            })
            .flatten();
    }

    GetFromLeaves(fromClause : m.FromClauseNode): m.FromClauseNode[]{

        //Join operation
        if (fromClause.Join) {

            return this.GetFromLeaves(fromClause.Join.Left).concat(this.GetFromLeaves(fromClause.Join.Right));
        }
        //Over operation
        else if (fromClause.Over) {
            this.GetFromLeaves(fromClause.Over.Left);
        }
        //Leaf
        else {
            return [fromClause];
        }
    }

    Validate(): any[]{
        return val.Validate(this.stmt);
    }

    Execute(): m.QueryResult {
        //Filter out scope-specific datasources
        var datasources = this.GetDatasources()
            .filter(ds => ds.Type !== 'var');

        var iterator = new LazyJsQueryIterator(this.GetResultsSequence());

        return new JsoqlQueryResult(iterator, datasources, []);
    }

    private GetResultsSequence(): Q.Promise<LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>> {
        var evaluator = new evl.Evaluator(this.dataSourceSequencers); 
        var deferred = Q.defer<LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>>();

        var seqP: Q.Promise<LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>>;

        //From
        var seq = this.From(this.stmt.From, error => deferred.reject(error), evaluator);

        //Where
        if (this.stmt.Where) seq = this.Where(seq, this.stmt.Where, evaluator);

        //Grouping
        //Explicitly
        if (this.stmt.GroupBy) {
            seqP = this.GroupBy(seq, this.stmt.GroupBy.Groupings, evaluator)
                .then(groups => this.SelectGrouped(groups, this.stmt.GroupBy.Having, evaluator));
        }
        //Implicitly
        else if (lazy(this.stmt.Select.SelectList).some(selectable => evl.Evaluator.IsAggregate(selectable.Expression))) {

            seqP = JsoqlQuery.SequenceToArray(seq)
                .then(items => lazy(this.SelectMonoGroup(items, evaluator)));
        }
        //No grouping
        else {
            seqP = Q(this.SelectUngrouped(seq, evaluator));
        }

        if (this.stmt.Union) {
            var right = new JsoqlQuery(this.stmt.Union, this.dataSourceSequencers, this.queryContext);
            seqP = Q.all([seqP, right.GetResultsSequence()])
                .then(seqs => {
                    return seqs[0].concat(<any>seqs[1]);
                })
        }
        
        seqP.done(seq => deferred.resolve(seq));

        return deferred.promise;
    }

    private GroupBySync(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
        expressions: any[],
        evaluator : evl.Evaluator): LazyJS.Sequence<m.Group> {
        var groupKey = (item: any) => {
            var object = lazy(expressions)
                .map(exp => [evl.Evaluator.Alias(exp), evaluator.Evaluate(exp, item)])
                .toObject();

            return JSON.stringify(object);
        };

        var items = JsoqlQuery.SequenceToArraySync(seq);
          
        var grouped = lazy(items).groupBy(groupKey);
        var lazyGroups = grouped.toArray();
        var groups: m.Group[] = lazyGroups.map(lg => {
            return {
                Key: JSON.parse(lg[0]),
                Items: lg[1]
            };
        });

        return lazy(groups);
    }

    private GroupBy(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
        expressions: any[],
        evaluator : evl.Evaluator): Q.Promise<LazyJS.Sequence<m.Group>> {
        var groupKey = (item: any) => {
            var object = lazy(expressions)
                .map(exp => [JSON.stringify(exp), evaluator.Evaluate(exp, item)])
                .toObject();

            return JSON.stringify(object);
        };

        return JsoqlQuery.SequenceToArray(seq)
            .then(items => {
            var grouped = lazy(items).groupBy(groupKey);
            var lazyGroups = grouped.toArray();
            var groups: m.Group[] = lazyGroups.map(lg => {
                return {
                    Key: JSON.parse(lg[0]),
                    Items: lg[1]
                };
            });

            return lazy(groups);
        });
    }

    private static SequenceToArraySync<T>(seq: LazyJS.Sequence<T>|LazyJS.AsyncSequence<any>): T[] {
        var arrayPromise: any = seq.toArray();

        if (util.IsArray(arrayPromise)) return arrayPromise;
        else {
            throw new Error('Sequence is asynchronous');
        }
    }

    private static SequenceToArray<T>(seq: LazyJS.Sequence<T>|LazyJS.AsyncSequence<any>): Q.Promise<T[]> {
        var arrayPromise: any = seq.toArray();

        if (util.IsArray(arrayPromise)) return Q(arrayPromise);
        else {
            var deferred = Q.defer<T[]>();

            arrayPromise.then(
                result => deferred.resolve(result),
                error => deferred.reject(error)
                );

            arrayPromise.onError(error => {
                deferred.reject(error);
            });

            return deferred.promise;
        }
    }
}
