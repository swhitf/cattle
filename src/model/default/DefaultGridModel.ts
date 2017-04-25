import { GridModel, Vector } from '../GridModel';
import { GridColumn } from '../GridColumn';
import { GridRow } from '../GridRow';
import { GridCell } from '../GridCell';
import { Point, PointInput } from '../../geom/Point';
import * as _ from '../../misc/Util';
import { DefaultGridCell } from './DefaultGridCell';


const Vectors = {
    nw: new Point(-1, -1),
    n: new Point(0, -1),
    ne: new Point(1, -1),
    e: new Point(1, 0),
    se: new Point(1, 1),
    s: new Point(0, 1),
    sw: new Point(-1, 1),
    w: new Point(-1, 0),
};

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

        this.refresh();
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
     * Given a cell column ref and row ref, returns the GridCell object that represents the cell at the location,
     * or null if no cell could be found.
     * @param colRef
     * @param rowRef
     */
    public locateCell(col:number, row:number):GridCell
    {
        return (this.coords[col] || {})[row] || null;
    }
    
    /**
     * From a given cell ref, walk once along the model in the specified vector.  Returns null if the model edge is
     * met.
     */
    public walkOnce(ref:string, vector:PointInput|Vector):GridCell
    {
        let step = typeof(vector) === 'string' ? Vectors[vector] : Point.create(vector);

        let start = this.findCell(ref);
        let col = start.colRef + step.x;
        let row = start.rowRef + step.y;

        return this.locateCell(col, row);
    }

    /**
     * From a given cell ref, walk along the model at the specified step vector until a cell is reached that matches
     * the specified predicate.  Returns null if the model edge is met before an acceptable cell is found.
     */
    public walkUntil(ref:string, vector:PointInput|Vector, predicate:(cell:GridCell) => boolean):GridCell
    {
        let step = typeof(vector) === 'string' ? Vectors[vector] : Point.create(vector);

        let start = this.findCell(ref);
        let pt = new Point(start.colRef, start.rowRef);

        while (true) {

            pt = pt.add(step);
            
            let current = this.locateCell(pt.x, pt.y);
            if (current) {
                if (predicate(current)) {
                    return current;
                }
            }
            else {
                return null;
            }
        }
    }

    /**
     * Refreshes internal caches used to optimize lookups and should be invoked after the model has been changed (structurally).
     */
    public refresh():void
    {
        let { cells } = this;

        this.refs = _.index(cells, x => x.ref);
        this.coords = {};

        for (let cell of cells)
        {
            for (let co = 0; co < cell.colSpan; co++) 
            {
                for (let ro = 0; ro < cell.rowSpan; ro++)
                {
                    let c = cell.colRef + co;
                    let r = cell.rowRef + ro;

                    let cix = this.coords[c] || (this.coords[c] = {});
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