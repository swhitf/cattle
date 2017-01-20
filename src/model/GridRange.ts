import { GridCell } from './GridCell';
import { GridModel } from './GridModel';
import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import * as _ from '../misc/Util';


/**
 * Describes a resolveExpr of grid cells.
 */
export class GridRange
{
    /**
     * Creates a new GridRange object that contains the cells with the specified refs from the
     * specified model.
     *
     * @param model
     * @param cellRefs
     * @returns {Range}
     */
    public static create(model:GridModel, cellRefs:string[]):GridRange
    {
        let lookup = _.index(cellRefs, x => x);

        let cells = [] as GridCell[];
        let lc = Number.MAX_VALUE, lr = Number.MAX_VALUE;
        let hc = Number.MIN_VALUE, hr = Number.MIN_VALUE;

        for (let c of model.cells)
        {
            if (!lookup[c.ref])
                continue;

            cells.push(c);

            if (lc > c.colRef) lc = c.colRef;
            if (hc < c.colRef) hc = c.colRef;
            if (lr > c.rowRef) lr = c.rowRef;
            if (hr < c.rowRef) hr = c.rowRef;
        }

        let ltr = cells.sort(ltr_sort);
        let ttb = cells.slice(0).sort(ttb_sort);

        return new GridRange({
            ltr: ltr,
            ttb: ttb,
            width: hc - lc,
            height: hr - lr,
            length: (hc - lc) * (hr - lr),
            count: cells.length,
        });
    }

    /**
     * Captures a range of cells from the specified model based on the specified vectors.  The vectors should be
     * two points in grid coordinates (e.g. col and row references) that draw a logical line across the grid.
     * Any cells falling into the rectangle created from these two points will be included in the selected resolveExpr.
     *
     * @param model
     * @param from
     * @param to
     * @param toInclusive
     * @returns {Range}
     */
    public static capture(model:GridModel, from:Point, to:Point, toInclusive:boolean = false):GridRange
    {
        //TODO: Explain this...
        let tl = new Point(from.x < to.x ? from.x : to.x, from.y < to.y ? from.y : to.y);
        let br = new Point(from.x > to.x ? from.x : to.x, from.y > to.y ? from.y : to.y);

        if (toInclusive)
        {
            br = br.add(1);
        }

        let dims = Rect.fromPoints(tl, br);
        let results = [] as string[];

        for (let r = dims.top; r < dims.bottom; r++)
        {
            for (let c = dims.left; c < dims.right; c++)
            {
                let cell = model.locateCell(c, r);
                if (cell)
                {
                    results.push(cell.ref);
                }
            }
        }

        return GridRange.create(model, results);
    }
    
    /**
     * Selects a range of cells using an Excel-like range expression. For example:
     * - A1 selects a 1x1 range of the first cell
     * - A1:A5 selects a 1x5 range from the first cell horizontally.
     * - A1:E5 selects a 5x5 range from the first cell evenly.
     * 
     * @param model
     * @param query
     */
    public static select(model:GridModel, query:string):GridRange
    {
        let [from, to] = query.split(':');
        let fromCell = resolve_expr_ref(model, from);

        if (!to)
        {
            if (!!fromCell)
            {
                return GridRange.create(model, [fromCell.ref]);
            }
        }
        else
        {
            let toCell = resolve_expr_ref(model, to);

            if (!!fromCell && !!toCell)
            {
                let fromVector = new Point(fromCell.colRef, fromCell.rowRef);
                let toVector = new Point(toCell.colRef, toCell.rowRef);
                return GridRange.capture(model, fromVector, toVector, true);
            }
        }

        return GridRange.empty();
    }

    /**
     * Creates an empty GridRange object.
     *
     * @returns {Range}
     */
    public static empty():GridRange
    {
        return new GridRange({
            ltr: [],
            ttb: [],
            width: 0,
            height: 0,
            length: 0,
            count: 0,
        });
    }

    /**
     * The cells in the resolveExpr ordered from left to right.
     */
    public readonly ltr:GridCell[];

    /**
     * The cells in the resolveExpr ordered from top to bottom.
     */
    public readonly ttb:GridCell[];

    /**
     * With width of the resolveExpr in columns.
     */
    public readonly width:number;

    /**
     * With height of the resolveExpr in rows.
     */
    public readonly height:number;

    /**
     * The number of cells in the resolveExpr (will be different to length if some cell slots contain no cells).
     */
    public readonly count:number;

    /**
     * The length of the resolveExpr (number of rows * number of columns).
     */
    public readonly length:number;

    private index:ObjectMap<GridCell>;

    private constructor(values:any)
    {
        _.extend(this, values);
    }

    /**
     * Indicates whether or not a cell is included in the range.
     */
    public contains(cellRef:string):boolean
    {
        if (!this.index)
        {
            this.index = _.index(this.ltr, x => x.ref);
        }

        return !!this.index[cellRef];
    }
}

function ltr_sort(a:GridCell, b:GridCell):number
{
    let n = 0;

    n = a.rowRef - b.rowRef;
    if (n === 0)
    {
        n = a.colRef - b.colRef;
    }

    return n;
}

function ttb_sort(a:GridCell, b:GridCell):number
{
    let n = 0;

    n = a.colRef - b.colRef;
    if (n === 0)
    {
        n = a.rowRef - b.rowRef;
    }

    return n;
}

function resolve_expr_ref(model:GridModel, value:string):GridCell
{
    const RefConvert = /([A-Za-z]+)([0-9]+)/g;

    RefConvert.lastIndex = 0;
    let result = RefConvert.exec(value);

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

    return model.locateCell(colRef - 1, rowRef - 1);
}