import { GridCell } from './GridCell';
import { GridModel } from './GridModel';
import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import * as _ from '../misc/util';


/**
 * Describes a range of grid cells.
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
     * Selects a range of cells from the specified model based on the specified vectors.  The vectors should be
     * two points in grid coordinates (e.g. col and row references) that draw a logical line across the grid.
     * Any cells falling into the rectangle created from these two points will be included in the selected range.
     *
     * @param model
     * @param from
     * @param to
     * @param toInclusive
     * @returns {Range}
     */
    public static select(model:GridModel, from:Point, to:Point, toInclusive:boolean = false):GridRange
    {
        if (toInclusive)
        {
            to = to.add(1);
        }

        let dims = Rect.fromPoints(from, to);
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
     * The cells in the range ordered from left to right.
     */
    public readonly ltr:GridCell[];

    /**
     * The cells in the range ordered from top to bottom.
     */
    public readonly ttb:GridCell[];

    /**
     * With width of the range in columns.
     */
    public readonly width:number;

    /**
     * With height of the range in rows.
     */
    public readonly height:number;

    /**
     * The number of cells in the range (will be different to length if some cell slots contain no cells).
     */
    public readonly count:number;

    /**
     * The length of the range (number of rows * number of columns).
     */
    public readonly length:number;

    private constructor(values:any)
    {
        _.extend(this, values);
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