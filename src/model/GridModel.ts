import { ObjectIndex, ObjectMap } from '../common';
import { GridColumn } from './GridColumn';
import { GridCell } from './GridCell';
import { GridRow } from './GridRow';
import { Point, PointInput } from '../geom/Point';
import * as u from '../misc/Util';


/**
 * Represents the logical composition of a grid.  It hosts the collections of the various entity model 
 * objects as well as methods for access and inspection.  All inspection methods use O(1) implementations.
 */
export class GridModel
{
    /**
     * Creates an grid model with the specified number of columns and rows populated with default cells.
     *
     * @param cols
     * @param rows
     */
    public static dim(width:number, height:number):GridModel
    {
        let cells = [] as GridCell[];
        let columns = [] as GridColumn[];
        let rows = [] as GridRow[];

        for (let c = 0; c < width; c++)
        {
            columns.push(new GridColumn(c));

            for (let r = 0; r < height; r++)
            {
                if (r == 0)
                {
                    rows.push(new GridRow(r));
                }

                cells.push(new GridCell({
                    colRef: c,
                    rowRef: r,
                    value: '',
                }));
            }
        }

        return new GridModel(cells, columns, rows);
    }

    /**
     * Creates an empty grid model.
     *
     * @returns {GridModel}
     */
    public static empty():GridModel
    {
        return new GridModel([], [], []);
    }

    /**
     * The grid cell definitions.  The order is arbitrary.
     */
    public readonly cells:GridCell[];

    /**
     * The grid column definitions.  The order is arbitrary.
     */
    public readonly columns:GridColumn[];

    /**
     * The grid row definitions.  The order is arbitrary.
     */
    public readonly rows:GridRow[];

    private byId:ObjectMap<GridCell>;
    private byCoord:ObjectIndex<ObjectIndex<GridCell>>;
    private dims = { width:0, height:0 };

    /**
     * Initializes a new instance of GridModel.
     *
     * @param cells
     * @param columns
     * @param rows
     */
    constructor(cells:GridCell[], columns:GridColumn[], rows:GridRow[])
    {
        this.cells = cells;
        this.columns = columns;
        this.rows = rows;

        this.refresh();
    }

    /**
     * Gets the width of the model in columns.
     */
    public get width():number
    {
        return this.dims.width;
    }

    /**
     * Gets the height of the model in rows.
     */
    public get height():number
    {
        return this.dims.height;
    }

    /**
     * Given a cell ref, returns the GridCell object that represents the cell, or null if the cell did not exist
     * within the model.
     * @param ref
     */
    public findCell(ref:string):GridCell
    {
        return this.byId[ref] || null;
    }

    /**
     * Given a cell ref, returns the GridCell object that represents the neighboring cell as per the specified
     * vector (direction) object, or null if no neighbor could be found.
     * @param ref
     * @param vector
     */
    public findCellNeighbor(ref:string, vector:Point):GridCell
    {
        let cell = this.findCell(ref);
        let col = cell.colRef + vector.x;
        let row = cell.rowRef + vector.y;

        return this.locateCell(col, row);
    }

    /**
     * Given a cell column ref and row ref, returns the GridCell object that represents the cell at the location,
     * or null if no cell could be found.
     * @param colRef
     * @param rowRef
     */
    public locateCell(col:number, row:number):GridCell
    {
        return (this.byCoord[col] || {})[row] || null;
    }

    /**
     * Refreshes internal caches used to optimize lookups and should be invoked after the model has been changed (structurally).
     */
    public refresh():void
    {
        let { cells } = this;

        this.byId = u.index(cells, x => x.ref);
        this.byCoord = {};
        this.dims = { width: 0, height: 0};

        for (let cell of cells)
        {
            if (this.dims.width < cell.colRef + cell.colSpan)
            {
                this.dims.width = cell.colRef + cell.colSpan;
            }

            if (this.dims.height < cell.rowRef + cell.rowSpan)
            {
                this.dims.height = cell.rowRef + cell.rowSpan;
            }

            for (let co = 0; co < cell.colSpan; co++) 
            {
                for (let ro = 0; ro < cell.rowSpan; ro++)
                {
                    let c = cell.colRef + co;
                    let r = cell.rowRef + ro;

                    let cix = this.byCoord[c] || (this.byCoord[c] = {});
                    if (cix[r])
                    {
                        console.warn('Two cells appear to occupy', c, 'x', r);
                    }
                    
                    cix[r] = cell;
                }
            }        
        }
    }
}