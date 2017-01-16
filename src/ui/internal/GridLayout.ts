import { DefaultGridColumn } from '../../model/default/DefaultGridColumn';
import { DefaultGridRow } from '../../model/default/DefaultGridRow';
import { GridCell } from '../../model/GridCell';
import { GridColumn } from '../../model/GridColumn';
import { GridModel } from '../../model/GridModel';
import { GridRow } from '../../model/GridRow';
import { Rect, RectLike } from '../../geom/Rect';
import * as _ from '../../misc/Util';


type CellColRowLookup = ObjectIndex<ObjectIndex<GridCell>>;

export interface GridLayoutRegion<T> extends RectLike
{
    readonly ref:T;
}

export class GridLayout
{
    public static compute(model:GridModel):GridLayout
    {
        let colLookup = <ObjectIndex<GridColumn>>model.columns.reduce((t, x) => { t[x.ref] = x; return t }, {});
        let rowLookup = <ObjectIndex<GridRow>>model.rows.reduce((t, x) => { t[x.ref] = x; return t }, {});
        let cellLookup = buildCellLookup(model.cells); //by col then row

        // Compute all expected columns and rows
        let maxCol = model.cells.map(x => x.colRef + (x.colSpan - 1)).reduce((t, x) => t > x ? t : x, 0);
        let maxRow = model.cells.map(x => x.rowRef + (x.rowSpan - 1)).reduce((t, x) => t > x ? t : x, 0);

        // Generate missing columns and rows
        for (let i = 0; i <= maxCol; i++)
        {
            (colLookup[i] || (colLookup[i] = new DefaultGridColumn(i)));
        }
        for (let i = 0; i <= maxRow; i++)
        {
            (rowLookup[i] || (rowLookup[i] = new DefaultGridRow(i)));
        }

        // Compute width and height of whole grid
        let width = _.values(colLookup).reduce((t, x) => t + x.width, 0);
        let height = _.values(rowLookup).reduce((t, x) => t + x.height, 0);

        // Compute the layout regions for the various bits
        let colRegs:GridLayoutRegion<number>[] = [];
        let rowRegs:GridLayoutRegion<number>[] = [];
        let cellRegs:GridLayoutRegion<string>[] = [];

        let accLeft = 0;
        for (let ci = 0; ci <= maxCol; ci++)
        {
            let col = colLookup[ci];

            colRegs.push({
                ref: col.ref,
                left: accLeft,
                top: 0,
                width: col.width,
                height: height,
            });

            let accTop = 0;
            for (let ri = 0; ri <= maxRow; ri++)
            {
                let row = rowLookup[ri];

                if (ci === 0)
                {
                    rowRegs.push({
                        ref: row.ref,
                        left: 0,
                        top: accTop,
                        width: width,
                        height: row.height,
                    });
                }

                if (cellLookup[ci] !== undefined && cellLookup[ci][ri] !== undefined)
                {
                    let cell = cellLookup[ci][ri];

                    cellRegs.push({
                        ref: cell.ref,
                        left: accLeft,
                        top: accTop,
                        width: col.width,
                        height: row.height,
                    });
                }

                accTop += row.height;
            }

            accLeft += col.width;
        }

        return new GridLayout(width, height, colRegs, rowRegs, cellRegs, cellLookup);
    }

    public readonly width:number;
    public readonly height:number;
    public readonly columns:GridLayoutRegion<number>[];
    public readonly rows:GridLayoutRegion<number>[];
    public readonly cells:GridLayoutRegion<string>[];

    private cellLookup:CellColRowLookup;
    private columnIndex:ObjectIndex<GridLayoutRegion<number>>;
    private rowIndex:ObjectIndex<GridLayoutRegion<number>>;
    private cellIndex:ObjectMap<GridLayoutRegion<string>>;

    private constructor(
        width:number, 
        height:number, 
        columns:GridLayoutRegion<number>[],
        rows:GridLayoutRegion<number>[],
        cells:GridLayoutRegion<string>[],
        cellLookup:CellColRowLookup)
    {
        this.width = width;
        this.height = height;
        this.columns = columns;
        this.rows = rows;
        this.cells = cells;

        this.cellLookup = cellLookup;
        this.columnIndex = _.index(columns, x => x.ref);
        this.rowIndex = _.index(rows, x => x.ref);
        this.cellIndex = _.index(cells, x => x.ref);
    }

    public queryColumn(ref:number):RectLike
    {
        return this.columnIndex[ref] || null;
    }

    public queryRow(ref:number):RectLike
    {
        return this.rowIndex[ref] || null;
    }

    public queryCell(ref:string):RectLike
    {
        return this.cellIndex[ref] || null;
    }

    public captureColumns(region:RectLike):number[]
    {
        return this.columns
            .filter(x => Rect.prototype.intersects.call(x, region))
            .map(x => x.ref);
    }

    public captureRows(region:RectLike):number[]
    {
        return this.rows
            .filter(x => Rect.prototype.intersects.call(x, region))
            .map(x => x.ref);
    }

    public captureCells(region:RectLike):string[]
    {
        let cols = this.captureColumns(region);
        let rows = this.captureRows(region);
        let cells = new Array<string>();

        for (let c of cols)
        {
            for (let r of rows)
            {
                let cell = this.cellLookup[c][r];
                if (!!cell)
                {
                    cells.push(cell.ref);
                }
            }
        }

        return cells;
    }
}

function buildCellLookup(cells:GridCell[]):CellColRowLookup
{
    let ix = {};
    
    for (let c of cells)
    {
        let cix = ix[c.colRef] || (ix[c.colRef] = {});
        cix[c.rowRef] = c;
    }
    
    return ix;
}