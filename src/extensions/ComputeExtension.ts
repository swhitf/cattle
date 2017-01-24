import { GridRow } from '../../export/lib/_export';
import { GridChangeSet } from './EditingExtension';
import { GridExtension, GridElement } from '../ui/GridElement';
import { GridKernel } from '../ui/GridKernel';
import { extend } from '../misc/Util';
import { GridRange } from '../model/GridRange';
import { Point } from '../geom/Point';
import { GridCell } from '../model/GridCell';
import { flatten } from '../misc/Util';


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

export interface GridCellWithFormula extends GridCell
{
    formula:string;
}

export interface Computer
{
    connect(grid:GridElement):void;

    compute(cellRefs?:string[], scope?:GridChangeSet):GridChangeSet

    evaluate(formula:string):string;

    inspect(formula:string):string[];

    program(cellRef:string, formula:string):void;
}

export class ComputeExtension implements GridExtension
{
    private readonly computer:Computer;

    private overrideNextCommit:boolean = false;
    private formulaCache:any = {};
    private grid:GridElement;
    private tracker:ObjectMap<string> = {};
    private watches:GridCellWatchManager = new GridCellWatchManager();

    constructor(computer?:Computer)
    {
        this.computer = computer || new JavaScriptFudgeComputer();
    }

    private get selection():string
    {
        return this.grid.kernel.variables.get('selection');
    }

    public init?(grid:GridElement, kernel:GridKernel):void
    {
        this.grid = grid;
        this.computer.connect(grid);

        kernel.routines.override('commit', this.commitOverride.bind(this));
        kernel.routines.override('beginEdit', this.beginEditOverride.bind(this));
        kernel.routines.override('endEdit', this.endEditOverride.bind(this));

        //grid.on('invalidate', this.flushFormulas.bind(this));
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

    private commitOverride(changes:GridChangeSet, impl:any):void
    {
        //TODO: Heavy optimization needed here...

        // let { grid, tracker, watches } = this;
        // let recurse = false;

        // if (this.overrideNextCommit)
        // {
        //     for (let ref of changes.refs())
        //     {
        //         let val = changes.get(ref);

        //         if (val.length > 0 && val[0] === '=')
        //         {
        //             let inputRanges = this
        //                 .inspectFormula(val)
        //                 .map(f => GridRange.select(grid.model, f))
        //                 .map(r => r.ltr.map(x => x.ref));

        //             watches.unwatch(ref);
        //             watches.watch(ref, flatten<string>(inputRanges));

        //             tracker[ref] = val;
        //             changes.put(ref, this.evaluateFormula(val), false);
        //         }
        //         else
        //         {
        //             if (val === '')
        //             {
        //                 watches.unwatch(ref);
        //                 delete tracker[ref];
        //             }

        //             let affectedCells = watches.getObserversOf(ref);
        //             for (let acRef of affectedCells)
        //             {
        //                 if (!!changes.get(acRef) || !tracker[acRef])
        //                     continue;                    

        //                 let formula = tracker[acRef];
        //                 changes.put(acRef, this.evaluateFormula(formula, changes), true);
        //                 recurse = true;
        //             }
        //         }
        //     }
        // }

        // if (recurse)
        // {
        //     this.commitOverride(changes, impl);
        // }
        // else
        {
            this.overrideNextCommit = false;
            impl(changes);
        }
    }
}

class GridCellWatchManager
{
    private observing:ObjectMap<string[]> = {};
    private observed:ObjectMap<string[]> = {};

    constructor()
    {
    }

    public clear():void
    {
        this.observing = {};
        this.observed = {};
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
        if (!subjects || !subjects.length)
            return;

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

export class JavaScriptFudgeComputer implements Computer
{
    private grid:GridElement;
    private buffer:ObjectMap<string> = {};
    private cache:ObjectMap<CompiledFormula> = {};

    public connect(grid:GridElement):void
    {
        this.grid = grid;
    }

    public evaluate(formula:string, changeScope?:GridChangeSet):string 
    {
        let func = this.compile(formula);
        return (func(changeScope || new GridChangeSet()) || 0).toString();
    }

    public compute(refs?:string[], scope?:GridChangeSet):GridChangeSet
    {
        let { grid, buffer } = this;

        let targets = (!!refs && !!refs.length)
            ? refs.map(x => grid.model.findCell(x))
            : grid.model.cells;
        scope = scope || new GridChangeSet();

        targets = this.expandAndSort(targets);

        for (let cell of targets)
        {
            let formula = buffer[cell.ref];
            let result = this.evaluate(formula, scope)

            scope.put(cell.ref, result, true);
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
        this.buffer[cellRef] = formula;
    }

    protected compile(formula:string):CompiledFormula
    {
        let func = this.cache[formula] as CompiledFormula;

        if (!func)
        {
            let exprs = this.inspect(formula);
            for (let x of exprs) 
            {
                formula = formula.split(x).join(`expr('${x}', arguments[1])`);
            }

            let functions = extend({}, SupportFunctions);
            functions.expr = this.resolve.bind(this);

            let code = `with (arguments[0]) { return (${formula.substr(1)}); }`.toLowerCase();
            func = this.cache[formula] = new Function(code).bind(null, functions);
        }

        return func;
    }

    protected expandAndSort(cells:GridCell[]):GridCell[]
    {
        let { grid, buffer } = this;

        let list = [] as GridCell[];
        let alreadyPushed = {} as ObjectMap<boolean>;

        const visit = (cell:GridCell):void =>
        {
            let formula = buffer[cell.ref];
            if (formula === undefined)
                return;

            if (alreadyPushed[cell.ref] === true)
                return;

            let dependencies = flatten<GridCell>(
                this.inspect(formula).map(x => GridRange.select(grid.model, x).ltr));

            for (let dc of dependencies)
            {
                visit(dc);
            }

            list.push(cell);
            alreadyPushed[cell.ref] = true;
        };

        return list;
    }

    protected resolve(expr:string, changeScope:GridChangeSet):number|number[]
    {
        var values = GridRange
            .select(this.grid.model, expr)
            .ltr
            .map(x => parseInt(changeScope.get(x.ref) || x.value) || 0);

        return values.length < 2
            ? (values[0] || 0)
            : values;
    }
}
