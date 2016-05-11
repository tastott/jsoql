var merge = require("merge");
import m = require("./models");

export class InternalQueryContext implements m.QueryContext {
    constructor(public BaseDirectory: string = null,
        public Data: {[key:string]: any[]} = {},
        public UseCache: boolean = false,
        public TableFunctions: {[key:string]: m.Statement} = {},
        public TableArguments: m.FromClauseNode[] = []){
            
    }
    
    public Spawn(additions: { TableFunctions?: {[key:string]: m.Statement}, TableArgument?: m.FromClauseNode, Data?: {[key:string]: any[]}}){
        let tableFunctions = additions.TableFunctions
            ? merge(true, this.TableFunctions, additions.TableFunctions)
            : this.TableFunctions;
            
        let tableArguments = additions.TableArgument 
            ? [additions.TableArgument] 
            : this.TableArguments;
            
        let data = additions.Data
            ? merge(false, this.Data, additions.Data)
            : this.Data;
            
        return new InternalQueryContext(this.BaseDirectory, data, this.UseCache, tableFunctions, tableArguments);
    }
}