import { GridModel } from '../GridModel';
import { GridColumn } from '../GridColumn';
import { GridRow } from '../GridRow';
import { GridCell } from '../GridCell';
import { Point } from '../../geom/Point';
import * as _ from '../../misc/Util'
import { DefaultGridCell } from './DefaultGridCell';


/**
 * Provides a by-the-book implementation of GridModel.  All inspection methods use O(1) implementations.
 */
export class DefaultGridModel implements GridModel
{
    /**
     * Creates an grid model with the specified number of columns and rows populated with default cells.
     *
     * @param cols
     * @param rows
     */
    public static dim(cols:number, rows:number):DefaultGridModel
    {
        let cells = [] as GridCell[];

        for (let c = 0; c < cols; c++)
        {
            for (let r = 0; r < rows; r++)
            {
                cells.push(new DefaultGridCell({
                    colRef: c,
                    rowRef: r,
                    value: '',
                }));
            }
        }

        return new DefaultGridModel(cells, [], []);
    }

    /**
     * Creates an empty grid model.
     *
     * @returns {DefaultGridModel}
     */
    public static empty():DefaultGridModel
    {
        return new DefaultGridModel([], [], []);
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

    private refs:ObjectMap<GridCell>;
    private coords:ObjectIndex<ObjectIndex<GridCell>>;

    /**
     * Initializes a new instance of DefaultGridModel.
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

        this.refs = _.index(cells, x => x.ref);
        this.coords = {};

        for (let c of cells)
        {
            let x = this.coords[c.colRef] || (this.coords[c.colRef] = {});
            x[c.rowRef] = c;
        }
    }

    /**
     * Given a cell ref, returns the GridCell object that represents the cell, or null if the cell did not exist
     * within the model.
     * @param ref
     */
    public findCell(ref:string):GridCell
    {
        return this.refs[ref] || null;
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
        return (this.coords[col] || {})[row] || null;
    }
}