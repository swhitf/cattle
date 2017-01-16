import { GridExtension, GridElement } from '../ui/GridElement';
import { GridKernel } from '../ui/GridKernel';
import { extend } from '../misc/Util';
import { GridRange } from '../model/GridRange';
import { Point } from '../geom/Point';
import { GridCell } from '../model/GridCell';


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
        return values.reduce((t, x) => t + x, 0);
    },
};



export class ComputeExtension implements GridExtension
{
    private grid:GridElement;
    private tracker:ObjectMap<string> = {};

    private get selection():string
    {
        return this.grid.kernel.variables.get('selection');
    }

    public init?(grid:GridElement, kernel:GridKernel):void
    {
        this.grid = grid;

        kernel.routines.override('commit', this.commitOverride.bind(this));
        kernel.routines.override('beginEdit', this.beginEditOverride.bind(this));
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

    private commitOverride(changes:ObjectMap<string>, impl:any):void
    {
        let { tracker } = this;

        for (let ref in changes)
        {
            let val = changes[ref];

            if (val.length > 0 && val[0] === '=')
            {
                tracker[ref] = val;
                changes[ref] = this.evaluate(val);
            }
        }

        impl(changes);
    }

    private evaluate(formula:string):string
    {
        let result = null as RegExpExecArray;
        while (result = RefExtract.exec(formula))
        {
            if (!result.length)
                continue;

            formula =
                formula.substr(0, result.index) +
                `expr('${result[0]}')` +
                formula.substring(result.index + result[0].length);
        }

        let functions = extend({}, SupportFunctions);
        functions.expr = this.resolveExpr.bind(this);

        let code = `with (arguments[0]) { return (${formula.substr(1)}); }`.toLowerCase();

        console.log(code);

        let f = new Function(code).bind(null, functions);
        return f().toString() || '0';
    }

    private resolveExpr(expr:string):number|number[]
    {
        let [from, to] = expr.split(':');

        let fromCell = this.resolveRef(from);

        if (to === undefined)
        {
            if (!!fromCell)
            {
                return parseInt(fromCell.value) || 0;
            }
        }
        else
        {
            let toCell = this.resolveRef(to);

            if (!!fromCell && !!toCell)
            {
                let fromVector = new Point(fromCell.colRef, fromCell.rowRef);
                let toVector = new Point(toCell.colRef, toCell.rowRef);

                let range = GridRange.select(this.grid.model, fromVector, toVector, true);
                return range.ltr.map(x => parseInt(x.value) || 0);
            }
        }

        return 0;
    }

    private resolveRef(nameRef:string):GridCell
    {
        RefConvert.lastIndex = 0;
        let result = RefConvert.exec(nameRef);

        let exprRef = result[1];
        let rowRef = parseInt(result[2]);
        let colRef = 0;

        for (let i = exprRef.length - 1; i >= 0; i--)
        {
            let x = (exprRef.length - 1) - i;
            let n = exprRef[x].toUpperCase().charCodeAt(0) - 64;
            colRef += n * (26 * i);

            if (i == 0)
            {
                colRef += n;
            }
        }

        return this.grid.model.locateCell(colRef - 1, rowRef - 1);
    }
}