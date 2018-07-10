import { ObjectIndex, ObjectMap } from '../common';
import { Padding } from '../geom/Padding';
import { PointLike } from '../geom/Point';
import { Rect, RectLike } from '../geom/Rect';
import * as u from '../misc/Util';
import { GridCell } from '../model/GridCell';
import { GridColumn } from '../model/GridColumn';
import { GridModel } from '../model/GridModel';
import { GridRow } from '../model/GridRow';


type CellColRowLookup = ObjectIndex<ObjectIndex<GridCell>>;

export interface GridLayoutRegion<T> extends RectLike
{
    readonly object:T;
}

export class GridLayout
{
    public static empty:GridLayout = new GridLayout(0, 0, [], [], [], {});

    public static compute(model:GridModel, padding:Padding):GridLayout
    {
        let colLookup = <ObjectIndex<GridColumn>>model.columns.reduce((t, x) => { t[x.ref] = x; return t }, {});
        let rowLookup = <ObjectIndex<GridRow>>model.rows.reduce((t, x) => { t[x.ref] = x; return t }, {});
        let cellLookup = buildCellLookup(model.cells.array); //by col then row

        // Compute all expected columns and rows
        let maxCol = model.cells.map(x => x.colRef + (x.colSpan - 1)).reduce((t, x) => t > x ? t : x, 0);
        let maxRow = model.cells.map(x => x.rowRef + (x.rowSpan - 1)).reduce((t, x) => t > x ? t : x, 0);

        // Generate missing columns and rows
        for (let i = 0; i <= maxCol; i++)
        {
            (colLookup[i] || (colLookup[i] = new GridColumn(i)));
        }
        for (let i = 0; i <= maxRow; i++)
        {
            (rowLookup[i] || (rowLookup[i] = new GridRow(i)));
        }

        // Compute width and height of whole grid
        let width = u.values(colLookup).reduce((t, x) => t + x.width, 0) + padding.horizontal;
        let height = u.values(rowLookup).reduce((t, x) => t + x.height, 0) + padding.vertical;

        // Compute the layout regions for the various bits
        let colRegs:GridLayoutRegion<GridColumn>[] = [];
        let rowRegs:GridLayoutRegion<GridRow>[] = [];
        let cellRegs:GridLayoutRegion<GridCell>[] = [];
        let loadTracker = {} as { [key:string]:boolean };

        let accLeft = padding.left;
        for (let ci = 0; ci <= maxCol; ci++)
        {
            let col = colLookup[ci];

            colRegs.push({
                object: col,
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
                        object: row,
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
                            object: cell,
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
    public readonly columns:GridLayoutRegion<GridColumn>[];
    public readonly rows:GridLayoutRegion<GridRow>[];
    public readonly cells:GridLayoutRegion<GridCell>[];

    private cellLookup:CellColRowLookup;
    private columnIndex:ObjectIndex<GridLayoutRegion<GridColumn>>;
    private rowIndex:ObjectIndex<GridLayoutRegion<GridRow>>;
    private cellIndex:ObjectMap<GridLayoutRegion<GridCell>>;

    private constructor(
        width:number, 
        height:number, 
        columns:GridLayoutRegion<GridColumn>[],
        rows:GridLayoutRegion<GridRow>[],
        cells:GridLayoutRegion<GridCell>[],
        cellLookup:CellColRowLookup)
    {
        this.width = width;
        this.height = height;
        this.columns = columns;
        this.rows = rows;
        this.cells = cells;

        this.cellLookup = cellLookup;
        this.columnIndex = u.index(columns, x => x.object.ref);
        this.rowIndex = u.index(rows, x => x.object.ref);
        this.cellIndex = u.index(cells, x => x.object.ref);
    }

    public captureColumns(region:RectLike):GridColumn[]
    {
        return this.columns
            .filter(x => Rect.prototype.intersects.call(x, region))
            .map(x => x.object);
    }

    public captureRows(region:RectLike):GridRow[]
    {
        return this.rows
            .filter(x => Rect.prototype.intersects.call(x, region))
            .map(x => x.object);
    }

    public captureCells(region:RectLike):GridCell[]
    {
        let lookup = this.cellLookup;
        let cols = this.captureColumns(region);
        let rows = this.captureRows(region);
        
        let cells = [] as GridCell[];
        let index = {} as any;

        for (let c of cols)
        {
            if (!lookup[c.ref])
                continue;

            for (let r of rows)
            {
                if (!lookup[c.ref][r.ref])
                    continue;

                const x = lookup[c.ref][r.ref];
                if (index[x.ref]) 
                    continue;

                cells.push(x);
                index[x.ref] = true;
            }
        }

        return cells;
    }

    public measureColumn(ref:number):RectLike
    {
        return this.columnIndex[ref] || null;
    }

    public measureColumnRange(fromRef:number, toRefEx:number):RectLike
    {
        let likes = [] as RectLike[];        

        for (let i = fromRef; i < toRefEx; i++)
        {
            likes.push(this.measureColumn(i));
        }
        
        return Rect.fromMany(likes.map(Rect.fromLike));
    }

    public measureRow(ref:number):RectLike
    {
        return this.rowIndex[ref] || null;
    }

    public measureRowRange(fromRef:number, toRefEx:number):RectLike
    {
        let likes = [] as RectLike[];        

        for (let i = fromRef; i < toRefEx; i++)
        {
            likes.push(this.measureRow(i));
        }
        
        return Rect.fromMany(likes.map(Rect.fromLike));
    }

    public measureCell(ref:string):RectLike
    {
        return this.cellIndex[ref] || null;
    }

    public pickColumn(at:PointLike):GridColumn
    {
        for (let c of this.columns)
        {
            if (Rect.prototype.contains.call(c, at))
            {   
                return c.object;
            }
        }

        return null;
    }

    public pickRow(at:PointLike):GridRow
    {
        for (let r of this.rows)
        {
            if (Rect.prototype.contains.call(r, at))
            {   
                return r.object;
            }
        }

        return null;
    }

    public pickCell(at:PointLike):GridCell
    {
        let c = this.pickColumn(at);
        let r = this.pickRow(at);

        if (!!c && !!r) 
        {
            return this.cellLookup[c.ref][r.ref];
        }

        return null;
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