import { Padding } from '../../geom/Padding';
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
    public static compute(model:GridModel, padding:Padding):GridLayout
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
        let width = _.values(colLookup).reduce((t, x) => t + x.width, 0) + padding.horizontal;
        let height = _.values(rowLookup).reduce((t, x) => t + x.height, 0) + padding.vertical;

        // Compute the layout regions for the various bits
        let colRegs:GridLayoutRegion<number>[] = [];
        let rowRegs:GridLayoutRegion<number>[] = [];
        let cellRegs:GridLayoutRegion<string>[] = [];
        let loadTracker = {} as { [key:string]:boolean };

        let accLeft = padding.left;
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

            let accTop = padding.top;
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
                    if (cell && !loadTracker[cell.ref])
                    {
                        let width = 0, height = 0;

                        //Take colSpan and rowSpan into account
                        for (let cix = ci; cix <= maxCol && cix < (ci + cell.colSpan); cix++)
                        {
                            width += colLookup[cix].width;
                        }
                        for (let rix = ri; rix <= maxRow && rix < (ri + cell.rowSpan); rix++)
                        {
                            height += rowLookup[rix].height;
                        }

                        cellRegs.push({
                            ref: cell.ref,
                            left: accLeft,
                            top: accTop,
                            width: width,
                            height: height,
                        });
                        
                        loadTracker[cell.ref] = true;
                    }
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

    public queryColumnRange(fromRef:number, toRefEx:number):RectLike
    {
        let likes = [] as RectLike[];        

        for (let i = fromRef; i < toRefEx; i++)
        {
            likes.push(this.queryColumn(i));
        }
        
        return Rect.fromMany(likes.map(Rect.fromLike));
    }

    public queryRow(ref:number):RectLike
    {
        return this.rowIndex[ref] || null;
    }

    public queryRowRange(fromRef:number, toRefEx:number):RectLike
    {
        let likes = [] as RectLike[];        

        for (let i = fromRef; i < toRefEx; i++)
        {
            likes.push(this.queryRow(i));
        }
        
        return Rect.fromMany(likes.map(Rect.fromLike));
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
        let lookup = this.cellLookup;
        let cols = this.captureColumns(region);
        let rows = this.captureRows(region);
        let cells = new Array<string>();

        for (let c of cols)
        {
            if (!lookup[c])
                continue;

            for (let r of rows)
            {
                if (!lookup[c][r])
                    continue;

                cells.push(lookup[c][r].ref);
            }
        }

        return cells;
    }
}

function buildCellLookup(cells:GridCell[]):CellColRowLookup
{
    let ix = {};
    
    for (let cell of cells)
    {
        for (let co = 0; co < cell.colSpan; co++) 
        {
            for (let ro = 0; ro < cell.rowSpan; ro++)
            {
                let c = cell.colRef + co;
                let r = cell.rowRef + ro;

                let cix = ix[c] || (ix[c] = {});
                if (cix[r])
                {
                    console.warn('Two cells appear to occupy', c, 'x', r);
                }
                
                cix[r] = cell;
            }
        }        
    }
    
    return ix;
}