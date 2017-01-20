import { css } from '../../export/lib/misc/Dom';
import { EventCallback, EventSubscription, GridEditEvent } from '../../export/lib/_export';
import { GridExtension, GridElement } from '../ui/GridElement';
import { GridKernel } from '../ui/GridKernel';
import { extend } from '../misc/Util';
import { GridRange } from '../model/GridRange';
import { Point } from '../geom/Point';
import { GridCell } from '../model/GridCell';
import { flatten } from '../misc/Util';


const RefExtract = /(?!.*['"`])[A-Za-z]+[0-9]+:?([A-Za-z]+[0-9])?/g;
const RefConvert = /([A-Za-z]+)([0-9]+)/g;

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
    sum: function(values:number[]):number
    {
        if (!Array.isArray(values)) values = [values];
        return values.reduce((t, x) => t + x, 0);
    },
};

export interface CompiledFormula
{
    (changeScope?:ObjectMap<string>):number;
}

export class ComputeExtension implements GridExtension
{
    private overrideNextCommit:boolean = false;
    private formulaCache:any = {};
    private grid:GridElement;
    private tracker:ObjectMap<string> = {};
    private watches:GridCellWatchManager = new GridCellWatchManager();

    private get selection():string
    {
        return this.grid.kernel.variables.get('selection');
    }

    public init?(grid:GridElement, kernel:GridKernel):void
    {
        this.grid = grid;

        kernel.routines.override('commit', this.commitOverride.bind(this));
        kernel.routines.override('beginEdit', this.beginEditOverride.bind(this));
        kernel.routines.override('endEdit', this.endEditOverride.bind(this));
    }

    private beginEditOverride(override:string, impl:any):boolean
    {
        let { selection, tracker } = this;

        if (!selection[0])
        {
            return false;
        }

        if (!override && override !== '')
        {
            override = tracker[selection[0]] || null;
        }

        return impl(override);
    }
    
    private endEditOverride(commit:boolean, impl:any):boolean
    {
        this.overrideNextCommit = commit === true;
        return impl(commit);
    }

    private commitOverride(changes:ObjectMap<string>, impl:any):void
    {
        //TODO: Heavy optimization needed here...

        let { grid, tracker, watches } = this;
        let recurse = false;

        if (this.overrideNextCommit)
        {
            for (let ref in changes)
            {
                let val = changes[ref];

                if (val.length > 0 && val[0] === '=')
                {
                    let inputRanges = this
                        .inspectFormula(val)
                        .map(f => GridRange.select(grid.model, f))
                        .map(r => r.ltr.map(x => x.ref));

                    watches.unwatch(ref);
                    watches.watch(ref, flatten<string>(inputRanges));

                    tracker[ref] = val;
                    changes[ref] = this.evaluateFormula(val);
                }
                else
                {
                    if (val === '')
                    {
                        watches.unwatch(ref);
                        delete tracker[ref];
                    }

                    let affectedCells = watches.getObserversOf(ref);
                    for (let acRef of affectedCells)
                    {
                        if (!!changes[acRef] || !tracker[acRef]) 
                            continue;                    

                        let formula = tracker[acRef];
                        changes[acRef] = this.evaluateFormula(formula, changes);
                        recurse = true;
                    }
                }
            }
        }

        if (recurse)
        {
            this.commitOverride(changes, impl);
        }
        else
        {
            this.overrideNextCommit = false;
            impl(changes);
        }
    }

    protected evaluateFormula(formula:string, changeScope?:ObjectMap<string>):string
    {
        let func = this.compileFormula(formula);
        return (func(changeScope) || 0).toString();
    }

    protected compileFormula(formula:string):CompiledFormula
    {
        let func = this.formulaCache[formula] as CompiledFormula;

        if (!func)
        {
            let exprs = this.inspectFormula(formula);
            for (let x of exprs) 
            {
                formula = formula.split(x).join(`expr('${x}', arguments[1] || {})`);
            }

            let functions = extend({}, SupportFunctions);
            functions.expr = this.resolveExpression.bind(this);

            let code = `with (arguments[0]) { return (${formula.substr(1)}); }`.toLowerCase();
            func = this.formulaCache[formula] = new Function(code).bind(null, functions);
        }

        return func;
    }

    protected inspectFormula(formula:string):string[]
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

    protected resolveExpression(expr:string, changeScope:ObjectMap<string>):number|number[]
    {
        var values = GridRange
            .select(this.grid.model, expr)
            .ltr
            .map(x => parseInt(changeScope[x.ref] || x.value) || 0);

        return values.length < 2
            ? (values[0] || 0)
            : values;
    }
}

class GridCellWatchManager
{
    private observing:ObjectMap<string[]> = {};
    private observed:ObjectMap<string[]> = {};

    constructor()
    {
    }

    public getObserversOf(cellRef:string):string[]
    {
        return this.observed[cellRef] || [];
    }

    public getObservedBy(cellRef:string):string[]
    {
        return this.observing[cellRef] || [];
    }

    public watch(observer:string, subjects:string[]):void
    {
        this.observing[observer] = subjects;
        for (let s of subjects)
        {
            let list = this.observed[s] || (this.observed[s] = []);
            list.push(observer);
        }
    }

    public unwatch(observer:string):void
    {
        let subjects = this.getObservedBy(observer);
        delete this.observing[observer];

        for (let s of subjects)
        {
            let list = this.observed[s] || [];
            let ix = list.indexOf(observer);
            if (ix >= 0)
            {
                list.splice(ix, 1);
            }
        }
    }
}