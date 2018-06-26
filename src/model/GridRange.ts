import { ObjectMap } from '../common';
import { Point } from '../geom/Point';
import * as u from '../misc/Util';
import { GridCell } from './GridCell';
import { GridModel } from './GridModel';
import { GridRef } from './GridRef';


/**
 * Specifies that an object has properties like those on the `GridRange` class.
 */
export interface GridRangeLike
{
    /**
     * The cells in the GridRange ordered from left to right.
     */
    readonly ltr:GridCell[];

    /**
     * The width of the GridRange in columns.
     */
    readonly width:number;

    /**
     * The height of the GridRange in rows.
     */
    readonly height:number;

    /**
     * The length of the GridRange (number of rows * number of columns).
     */
    readonly length:number;
}


/**
 * Provides a method of selecting and representing a range of cells from a `GridModel`.  GridRanges
 * will always be rectangular and contain no gaps unless there are cells missing.
 */
export class GridRange implements GridRangeLike
{
    /**
     * Creates a new GridRange object from the specified cellRefs by expanding the list to 
     * include those that fall within the rectangle of the upper left most and lower right 
     * most two cells in the list.  In the example below C2, D2, D3 and E3 will be expanded
     * to also include E2 and C3.
     * 
     * A B C D E F
     * 1         
     * 2   X X ^ 
     * 3   ^ X X 
     * 4         
     * 5         
     *
     * @param model
     * @param cellRefs
     * @returns {Range}
     */
    public static fromRefs(model:GridModel, cellRefs:string[]):GridRange
    {
        if (!cellRefs.length)
            return GridRange.empty();

        let [loCol, loRow] = GridRef.unmakeToArray(cellRefs[0]);
        let [hiCol, hiRow] = [loCol, loRow];

        for (let cr of cellRefs)
        {
            let [col, row] = GridRef.unmakeToArray(cr);

            if (loCol > col) loCol = col;
            if (hiCol < col) hiCol = col;
            if (loRow > row) loRow = row;
            if (hiRow < row) hiRow = row;
        }

        let cells = [] as GridCell[];
        let tracker = {} as any; //Track to prevent dupes when row/col span > 1

        for (let col = loCol; col < (hiCol + 1); col++)
        {
            for (let row = loRow; row < (hiRow + 1); row++)
            {
                let cell = model.locateCell(col, row);

                if (tracker[cell.ref])
                    continue;

                cells.push(cell);
                tracker[cell.ref] = true;
            }
        }
    
        return this.createInternal(model, cells);
    }

    /**
     * Returns a GridRange that includes all cells captured by computing a rectangle around the 
     * specified cell coordinates.
     * 
     * @param model 
     * @param points 
     */
    public static fromPoints(model:GridModel, points:Point[])
    {
        //Process points and wrap any that are out of bounds
        const wrap = (pt:Point) => {
            let x = pt.x;
            if (x < 0) x = 0;
            if (x >= model.width) x = model.width - 1;
            let y = pt.y;
            if (y < 0) y = 0;
            if (y >= model.height) y = model.height - 1;
            return { x, y };
        };

        let refs = points.map(wrap).map(p => GridRef.make(p.x, p.y));
        return GridRange.fromRefs(model, refs);
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
    public static fromQuery(model:GridModel, query:string):GridRange
    {
        let [from, to] = query.split(':');
        to = to || from;

        return GridRange.fromRefs(model, [to, from]);
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
        });
    }

    private static createInternal(model:GridModel, cells:GridCell[]):GridRange
    {
        if (!cells.length)
        {
            return GridRange.empty();
        }

        cells = cells.sort((a, b) => GridRef.compare(a.ref, b.ref));
        
        let [lc, lr] = GridRef.unmakeToArray(cells[0].ref);
        let [hc, hr] = GridRef.unmakeToArray(u.last(cells).ref);

        return new GridRange({
            ltr: cells,
            width: (hc - lc) + 1,
            height: (hr - lr) + 1,
            length: ((hc - lc) + 1) * ((hr - lr) + 1),
        });
    }

    /**
     * The cells in the GridRange ordered from left to right.
     */
    public readonly ltr:GridCell[];

    /**
     * The width of the GridRange in columns.
     */
    public readonly width:number;

    /**
     * The height of the GridRange in rows.
     */
    public readonly height:number;

    /**
     * The length of the GridRange (number of rows * number of columns).
     */
    public readonly length:number;

    private index:ObjectMap<GridCell>;

    private constructor(values:any)
    {
        u.extend(this, values);
    }

    /**
     * Indicates whether or not a cell is included in the range.
     */
    public contains(cellRef:string):boolean
    {
        if (!this.index)
        {
            this.index = u.index(this.ltr, x => x.ref);
        }

        return !!this.index[cellRef];
    }
    
    /**
     * Returns an array of the references for all the cells in the range.
     */
    public refs():string[]
    {
        return this.ltr.map(x => x.ref);
    }
    
    /**
     * Returns the first cell in the range.
     */
    public first():GridCell
    {
        return this.ltr[0] || null;
    }
    
    /**
     * Returns the last cell in the range.
     */
    public last():GridCell
    {
        return this.ltr[this.ltr.length - 1] || null;
    }
}