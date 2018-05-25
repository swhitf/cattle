import { ObjectMap } from '../../misc/Interfaces';
import { extend, flatten, index } from '../../misc/Util';
import { GridCell } from '../../model/GridCell';
import { GridRange } from '../../model/GridRange';
import { GridElement } from '../../ui/GridElement';
import { GridChangeSet } from '../common/EditingExtension';
import { ComputeEngine } from './ComputeEngine';
import { WatchManager } from './WatchManager';


const RefExtract = /(?!.*['"`])[A-Za-z]+[0-9]+:?([A-Za-z]+[0-9]+)?/g;

const SupportFunctions = {
    //Math:
    abs: Math.abs,
    acos: Math.acos,
    asin: Math.asin,
    atan: Math.atan,
    atan2: Math.atan2,
    ceil: Math.ceil,
    cos: Math.cos,
    exp: Math.exp,
    floor: Math.floor,
    log: Math.log,
    max: Math.max,
    min: Math.min,
    pow: Math.pow,
    random: Math.random,
    round: Math.round,
    sin: Math.sin,
    sqrt: Math.sqrt,
    tan: Math.tan,
    //Custom:
    avg: function(values:number[]):number
    {
        return SupportFunctions.sum(values) / values.length;
    },
    sum: function(values:number[]):number
    {
        if (!Array.isArray(values)) values = [values];
        return values.reduce((t, x) => t + x, 0);
    },
};

export interface CompiledFormula
{
    (changeScope?:GridChangeSet):number;
}

export class JavaScriptComputeEngine implements ComputeEngine
{
    private grid:GridElement;
    private formulas:ObjectMap<string> = {};
    private cache:ObjectMap<CompiledFormula> = {};
    private watches:WatchManager = new WatchManager();
    
    public getFormula(cellRef:string):string
    {
        return this.formulas[cellRef] || undefined;
    }

    public clear(cellRefs?:string[]):void
    {
        if (!!cellRefs && !!cellRefs.length)
        {
            for (let cr of cellRefs) 
            {
                delete this.formulas[cr];
                this.watches.unwatch(cr);
            }
        }
        else
        {
            this.formulas = {};
            this.watches.clear();   
        }
    }

    public connect(grid:GridElement):void
    {
        this.clear();
        this.grid = grid;
    }

    public evaluate(formula:string, changeScope?:GridChangeSet):string 
    {
        let func = this.compile(formula);
        return (func(changeScope || new GridChangeSet()) || 0).toString();
    }

    public compute(cellRefs:string[] = [], scope:GridChangeSet = new GridChangeSet(), cascade:boolean = true):GridChangeSet
    {
        let { grid, formulas } = this;

        let lookup = index(cellRefs, x => x);
        let targets = (!!cellRefs.length ? cellRefs : Object.keys(this.formulas))
            .map(x => grid.model.findCell(x));

        if (cascade)
        {
            targets = this.cascadeTargets(targets);
        }

        for (let cell of targets)
        {
            let formula = formulas[cell.ref];
            if (formula)
            {
                let result = this.evaluate(formula, scope)
                scope.put(cell.ref, result, !lookup[cell.ref]);
            }
        }

        return scope;
    }

    public inspect(formula:string):string[] 
    {
        let exprs = [] as string[];
        let result = null as RegExpExecArray;

        while (result = RefExtract.exec(formula))
        {
            if (!result.length)
                continue;
            
            exprs.push(result[0]);
        }

        return exprs;
    }

    public program(cellRef:string, formula:string):void
    {
        this.formulas[cellRef] = formula;

        let exprs = this.inspect(formula);
        let dpnRanges = exprs.map(x => GridRange.select(this.grid.model, x).ltr);
        let dpns = flatten<GridCell>(dpnRanges).map(x => x.ref);

        if (dpns.length)
        {
            this.watches.watch(cellRef, dpns);
        }
    }

    protected compile(formula:string):CompiledFormula
    {
        function find(formula:string, ref:string):number 
        {
            for (let i = 0; i < formula.length; i++) 
            {
                if (formula[i] == ref[0]) 
                {
                    if (formula.substr(i, ref.length) === ref) 
                    {
                        let nc = formula[i + ref.length];
                        if (!nc || !nc.match(/\w/)) 
                        {
                            return i;
                        }
                    }  
                }
            }
            return -1;
        }

        try
        {
            //Store key separately because we change the formula...
            let cacheKey = formula;
            let func = this.cache[cacheKey] as CompiledFormula;

            if (!func)
            {
                let exprs = this.inspect(formula);

                for (let x of exprs) 
                {
                    let idx = find(formula, x);
                    if (idx >= 0) 
                    {
                        formula = formula.substring(0, idx) + `expr('${x}', arguments[1])` + formula.substring(idx + x.length);
                    }
                }

                let functions = extend({}, SupportFunctions);
                functions.expr = this.resolve.bind(this);

                let code = `with (arguments[0]) { try { return (${formula.substr(1)}); } catch (e) { console.error(e); return 0; } }`.toLowerCase();
                func = this.cache[cacheKey] = new Function(code).bind(null, functions);
            }

            return func;
        }
        catch (e)
        {
            console.error('compile:', e);
            console.error(formula);
            return x => 0;
        }
    }

    protected cascadeTargets(cells:GridCell[]):GridCell[]
    {
        let { grid, formulas, watches } = this;

        let list = [] as GridCell[];
        let alreadyPushed = {} as ObjectMap<boolean>;

        const visit = (cell:GridCell):void =>
        {
            if (alreadyPushed[cell.ref] === true)
                return;

            let dependencies = watches.getObserversOf(cell.ref)
                .map(x => grid.model.findCell(x));

            for (let dc of dependencies)
            {
                visit(dc);
            }

            if (!!formulas[cell.ref])
            {
                list.splice(0, 0, cell);
            }

            alreadyPushed[cell.ref] = true;
        };

        for (let c of cells)
        {
             visit(c);            
        }

        return list;
    }

    protected resolve(expr:string, changeScope:GridChangeSet):number|number[]
    {
        var values = GridRange
            .select(this.grid.model, expr)
            .ltr
            .map(x => this.coalesceFloat(changeScope.get(x.ref), x.value));

        return values.length < 2
            ? (values[0] || 0)
            : values;
    }

    private coalesceFloat(...values:string[]):number
    {
        for (let v of values)
        {
            if (v !== undefined)
            {
                return parseFloat(v) || 0;
            }
        }

        return 0;
    }
}
