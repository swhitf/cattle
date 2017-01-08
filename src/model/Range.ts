import { CellModel } from './CellModel';
import { GridModel } from './GridModel';
import * as _ from '../misc/util';


export class Range
{
    public static create(model:GridModel, cellRefs:string[]):Range
    {
        let lookup = _.index(cellRefs, x => x);

        let cells = [] as CellModel[];
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

    public readonly ltr:CellModel[];
    public readonly ttb:CellModel[];
    public readonly width:number;
    public readonly height:number;
    public readonly count:number;
    public readonly length:number;

    private constructor(values:any)
    {
        _.extend(this, values);
    }
}

function ltr_sort(a:CellModel, b:CellModel):number
{
    let n = 0;

    n = a.rowRef - b.rowRef;
    if (n === 0)
    {
        n = a.colRef - b.colRef;
    }

    return n;
}

function ttb_sort(a:CellModel, b:CellModel):number
{
    let n = 0;

    n = a.colRef - b.colRef;
    if (n === 0)
    {
        n = a.rowRef - b.rowRef;
    }

    return n;
}