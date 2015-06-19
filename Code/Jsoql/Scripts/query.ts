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
var hrtime: (start?: number[]) => number[] = require('browser-process-hrtime')

interface DatasourceConfig {
    Target: any;
    Alias: string;
    Parameters?: any;
    Condition?: any;
    Over?: boolean; 
    SubQuery?: boolean;
}

class CallbackSet<T> {

    private callbacks: ((arg: T) => void)[];

    constructor() {
        this.callbacks = [];
    }

    public Add(callback: (arg: T) => void) {
        this.callbacks.push(callback);
    }

    public DoAll(arg: T) {
        this.callbacks.forEach(c => c(arg));
        this.callbacks = [];
    }

    public RemoveAll() {
        this.callbacks = [];
    }

}

class LazyJsQueryIterator implements m.QueryIterator {

    private currentIndex: number;
    private items: any[];
    private onCancel: () => void;
    private itemCallbacks: {
        Count?: number;
        Do: (items: any[]) => void;
    }[];
    private onComplete: CallbackSet<any>;
    private onError: CallbackSet<any>;
    private isComplete: boolean;
    private startTime: number[];
    private finishTime: number[];


    constructor(sequencePromise: Q.Promise<LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>>)
    {
        this.currentIndex = 0;
        this.items = [];
        this.itemCallbacks = [];
        this.isComplete = false;
        this.onComplete = new CallbackSet<any>();
        this.onError = new CallbackSet<any>();
        this.startTime = hrtime();

        sequencePromise
            .then(seq => {
                var handle = seq.each(item => this.AddItem(item));
                if (handle && handle['cancel']) {
                    this.onCancel = () => handle['cancel']();
                    handle['onComplete'](() => this.SetComplete());
                    handle['onError'](err => {
                        this.onError.DoAll(err);
                    });
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
            Do: deferred.resolve
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
        while (this.itemCallbacks.length) {
            var callback = this.itemCallbacks[0];

            if (callback.Count && this.items.length >= this.currentIndex + callback.Count) {
                this.itemCallbacks.shift();
                callback.Do(this.GetChunk(callback.Count));
            }
            else if (this.isComplete) {
                this.itemCallbacks.shift();
                callback.Do(this.GetChunk(callback.Count));
            }
            else break;
        }
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
    private evaluator: evl.Evaluator;

    constructor(private stmt: m.Statement,
        private dataSourceSequencers : ds.DataSourceSequencers,
        queryContext?: m.QueryContext) {

        queryContext = queryContext || {};

        this.queryContext = {
            BaseDirectory: queryContext.BaseDirectory || process.cwd(),
            Data: queryContext.Data || {}
        };

        this.evaluator = new evl.Evaluator(this.dataSourceSequencers); 
    }

    private ToDatasource(target: any) : m.Datasource {
        //Property
        if (typeof target != 'string') {
            return {
                Type: 'var',
                Value: target
            };
        }
        else {
            var match = target.match(JsoqlQuery.UriRegex);

            if (!match) {
                return {
                    Type: 'var',
                    Value: target
                }
            }
            else {
                return {
                    Type: match[1].toLowerCase(),
                    Value: match[2]
                };
            }
        }
    }

    private GetSequence(config : DatasourceConfig, onError : m.ErrorHandler): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        if (config.SubQuery) {
            var subQuery = new JsoqlQuery(config.Target, this.dataSourceSequencers, this.queryContext);
            return new lazyExt.PromisedSequence(subQuery.GetResultsSequence());
        }

        var ds = this.ToDatasource(config.Target);
        var sequencer: ds.DataSourceSequencer;
        var parameters = {};

        if (ds.Type === 'var') {
            sequencer = this.dataSourceSequencers['var'];
        }
        else {
            parameters = config.Parameters || parameters;
            sequencer = this.dataSourceSequencers[ds.Type];
            if (!sequencer) throw new Error("Invalid scheme for data source: '" + ds.Type + "'");
        }

        return sequencer.Get(ds.Value, parameters, this.queryContext, onError);
    }

    private From(fromClause: any, onError: m.ErrorHandler): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        var targets = this.CollectDatasources(fromClause);

        var seq = this.GetSequence(targets[0], onError);

        if (targets.length > 1 || targets[0].Alias) {
            var aliases = lazy(targets).map(t => t.Alias);

            //Aliases are mandatory if multiple targets are used
            if (targets.length > 1 && lazy(aliases).some(a => !a)) {
                throw 'Each table must have an alias if more than one table is specified';
            }
            if (aliases.uniq().size() < targets.length) {
                throw 'Table aliases must be unique';
            }

            //Map each item to a property with the alias of its source table
            seq = seq.map(item => {
                var mapped = {};
                mapped[targets[0].Alias] = item;
                return mapped;
            });

            //Join/over each subsequent table
            lazy(targets).slice(1).each(target => {

                if (target.Condition) seq = this.Join(seq, this.GetSequence(target, onError), target.Alias, target.Condition);
                else if (target.Over) seq = this.Over(seq, target.Target, target.Alias);
                else throw new Error("Unsupported FROM clause");
               
            });
        }

        return seq;
    }

    private Over(left: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
        childExpression : any,
        childAlias: string): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        return left.map(li => {
            var children = this.evaluator.Evaluate(childExpression, li) || [];
            return children.map(child => {
                var merged = clone(li);
                merged[childAlias] = child;
                return merged;
            });
        })
        .flatten();

    }

    private Join(left: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
        right: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
        rightAlias: string,
        condition : any): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any> {

        //For each item on left of join, find 0 to many matching items from the right side, using the ON expression
        return left.map(li => {
            return right.map(ri => {
                //Create prospective merged item containing left and right side items
                var merged = clone(li);
                merged[rightAlias] = ri;

                //Return non-null value to indicate match
                if (this.evaluator.Evaluate(condition, merged)) return merged;
                else return null;
            })
            .compact() //Throw away null (non-matching) values
        })
        .flatten(); //Flatten the sequence of sequences

    }

    private CollectDatasources(fromClauseNode: m.FromClauseNode): DatasourceConfig[] {

        //Join
        if (fromClauseNode.Expression) {
            return this.CollectDatasources(fromClauseNode.Left)
                .concat(this.CollectDatasources(fromClauseNode.Right)
                .map(n => {
                        n.Condition = fromClauseNode.Expression;
                        return n;
                    })
                );
        }
        //Over
        else if (fromClauseNode.Over) {
            return this.CollectDatasources(fromClauseNode.Left)
                .concat([{ Target: fromClauseNode.Over, Alias: fromClauseNode.Alias, Over: true }]);       
        }
        //Aliased
        else if (fromClauseNode.Target) {
            //Quoted
            if (fromClauseNode.Target.Quoted) {
                return [{ Target: fromClauseNode.Target.Quoted, Alias: fromClauseNode.Alias }];
            }
            //Unquoted
            else {
                var collected = this.CollectDatasources(fromClauseNode.Target);
                return [{ Target: collected[0].Target, Alias: fromClauseNode.Alias, Parameters: collected[0].Parameters }];
            }
        }
        //Object
        else if (fromClauseNode.KeyValues) {
            var keyValues = lazy(fromClauseNode.KeyValues)
                .map(kv => {
                    return {
                        Key: kv.Key,
                        Value: evl.Evaluator.Evaluate(kv.Value, null)
                    };
                });
            var uri = keyValues.find(kv => kv.Key === 'uri');
            if (!uri) throw new Error("Datasource is missing the 'uri' property.");

            return [{
                Target: uri.Value,
                Alias: null,
                Parameters: keyValues
                    .filter(kv => kv.Key !== 'uri')
                    .map(kv => [kv.Key, kv.Value])
                    .toObject()
            }];
        }
        //Sub-query
        else if (fromClauseNode.SubQuery) {
            return [{
                Target: fromClauseNode.SubQuery,
                Alias: null,
                SubQuery: true
            }];
        }
        //Un-aliased
        else {
            //Quoted
            if (fromClauseNode.Quoted) {
                return [{ Target: fromClauseNode.Quoted, Alias: null }];
            }
            //Un-quoted
            else {
                return [{ Target: fromClauseNode, Alias: null }];
            }
        }

    }

    private Where(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>, whereClause : any): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>{
        return seq.filter(item => {
            return this.evaluator.Evaluate(this.stmt.Where, item);
        })
    }

    private SelectGrouped(groups: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>,
        having: any): LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>{

        if (having) {
            groups = groups.filter(group => this.evaluator.EvaluateGroup(having, group));
        }


        (this.stmt.OrderBy || []).forEach(orderByExp => {
            groups = groups.sortBy(group => this.evaluator.EvaluateGroup(orderByExp.Expression, group), !orderByExp.Asc);
        });

        return groups.map(group =>
            lazy(this.stmt.Select.SelectList)
                .map(selectable => [
                selectable.Alias || evl.Evaluator.Alias(selectable.Expression),
                this.evaluator.EvaluateGroup(selectable.Expression, group)
            ])
                .toObject()
            )
            .first(this.stmt.Select.Limit || Number.MAX_VALUE);
    }
    private SelectMonoGroup(items : any[]): any[] {
        
        var group: m.Group = {
            Key: {},
            Items: items
        };

        return [
            lazy(this.stmt.Select.SelectList)
                .map(selectable => [
                selectable.Alias || evl.Evaluator.Alias(selectable.Expression),
                this.evaluator.EvaluateGroup(selectable.Expression, group)
            ])
            .toObject()
        ];
    }

    private SelectUngrouped(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>): LazyJS.Sequence<any>|LazyJS.AsyncSequence <any>{
        (this.stmt.OrderBy || []).forEach(orderByExp => {
            seq = seq.sortBy(item => this.evaluator.Evaluate(orderByExp.Expression, item), !orderByExp.Asc);
        });

        //Select
        return seq
            .first(this.stmt.Select.Limit || Number.MAX_VALUE)
            .map(item => {
            return lazy(this.stmt.Select.SelectList)
                .map(selectable =>
                    this.evaluator.EvaluateAliased(selectable.Expression, item)
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
        //From
        var seq = this.From(this.stmt.From,() => { });

        //Where
        if (this.stmt.Where) seq = this.Where(seq, this.stmt.Where);

        var results: any[];

        //Grouping
        //Explicitly
        if (this.stmt.GroupBy) {
            seq = this.GroupBySync(seq, this.stmt.GroupBy.Groupings)
            seq = this.SelectGrouped(seq, this.stmt.GroupBy.Having);
            results = JsoqlQuery.SequenceToArraySync(seq);
        }
        //Implicitly
        else if (lazy(this.stmt.Select.SelectList).some(selectable => evl.Evaluator.IsAggregate(selectable.Expression))) {

            var items = JsoqlQuery.SequenceToArraySync(seq);
            results = this.SelectMonoGroup(items);
        }
        //No grouping
        else {
            results = JsoqlQuery.SequenceToArraySync(this.SelectUngrouped(seq));
        }

        if (this.stmt.Union) {
            var right = new JsoqlQuery(this.stmt.Union, this.dataSourceSequencers, this.queryContext);
            return results.concat(right.ExecuteSync());
        }
        else return results;
    }

    GetDatasources(): m.Datasource[]{
        return this.CollectDatasources(this.stmt.From)
            .map(dsc => this.ToDatasource(dsc.Target));
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

        var deferred = Q.defer<LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>>();

        var seqP: Q.Promise<LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>>;

        //From
        var seq = this.From(this.stmt.From, error => deferred.reject(error));

        //Where
        if (this.stmt.Where) seq = this.Where(seq, this.stmt.Where);

        //Grouping
        //Explicitly
        if (this.stmt.GroupBy) {
            seqP = this.GroupBy(seq, this.stmt.GroupBy.Groupings)
                .then(groups => this.SelectGrouped(groups, this.stmt.GroupBy.Having));
        }
        //Implicitly
        else if (lazy(this.stmt.Select.SelectList).some(selectable => evl.Evaluator.IsAggregate(selectable.Expression))) {

            seqP = JsoqlQuery.SequenceToArray(seq)
                .then(items => lazy(this.SelectMonoGroup(items)));
        }
        //No grouping
        else {
            seqP = Q(this.SelectUngrouped(seq));
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

    private GroupBySync(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>, expressions : any[]): LazyJS.Sequence<m.Group> {
        var groupKey = (item: any) => {
            var object = lazy(expressions)
                .map(exp => [evl.Evaluator.Alias(exp), this.evaluator.Evaluate(exp, item)])
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

    private GroupBy(seq: LazyJS.Sequence<any>|LazyJS.AsyncSequence<any>, expressions: any[]): Q.Promise<LazyJS.Sequence<m.Group>> {
        var groupKey = (item: any) => {
            var object = lazy(expressions)
                .map(exp => [JSON.stringify(exp), this.evaluator.Evaluate(exp, item)])
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
