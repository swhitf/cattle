import { GridModelIndex } from './GridModelIndex';
import { GridCell } from './GridCell';
import { GridModel } from './GridModel';
import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import * as _ from '../misc/util';


export class Range
{
    public static create(model:GridModel, cellRefs:string[]):Range
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

        return new Range({
            ltr: ltr,
            ttb: ttb,
            width: hc - lc,
            height: hr - lr,
            length: (hc - lc) * (hr - lr),
            count: cells.length,
        });
    }

    public static select(model:GridModel, from:Point, to:Point, toInclusive:boolean = false):Range
    {
        if (toInclusive)
        {
            to = to.add(1);
        }

        let index = new GridModelIndex(model);
        let dims = Rect.fromPoints(from, to);
        let results = [] as string[];

        for (let r = dims.top; r < dims.bottom; r++)
        {
            for (let c = dims.left; c < dims.right; c++)
            {
                let cell = index.locateCell(c, r);
                if (cell)
                {
                    results.push(cell.ref);
                }
            }
        }

        return Range.create(model, results);
    }

    public static empty():Range
    {
        return new Range({
            ltr: [],
            ttb: [],
            width: 0,
            height: 0,
            length: 0,
            count: 0,
        });
    }

    public readonly ltr:GridCell[];
    public readonly ttb:GridCell[];
    public readonly width:number;
    public readonly height:number;
    public readonly count:number;
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