import { GridModel } from '../GridModel';
import { GridColumn } from '../GridColumn';
import { GridRow } from '../GridRow';
import { GridCell } from '../GridCell';
import { Point } from '../../geom/Point';
/**
 * Provides a by-the-book implementation of GridModel.  All inspection methods use O(1) implementations.
 */
export declare class DefaultGridModel implements GridModel {
    /**
     * Creates an grid model with the specified number of columns and rows populated with default cells.
     *
     * @param cols
     * @param rows
     */
    static dim(cols: number, rows: number): DefaultGridModel;
    /**
     * Creates an empty grid model.
     *
     * @returns {DefaultGridModel}
     */
    static empty(): DefaultGridModel;
    /**
     * The grid cell definitions.  The order is arbitrary.
     */
    readonly cells: GridCell[];
    /**
     * The grid column definitions.  The order is arbitrary.
     */
    readonly columns: GridColumn[];
    /**
     * The grid row definitions.  The order is arbitrary.
     */
    readonly rows: GridRow[];
    private refs;
    private coords;
    /**
     * Initializes a new instance of DefaultGridModel.
     *
     * @param cells
     * @param columns
     * @param rows
     */
    constructor(cells: GridCell[], columns: GridColumn[], rows: GridRow[]);
    /**
     * Given a cell ref, returns the GridCell object that represents the cell, or null if the cell did not exist
     * within the model.
     * @param ref
     */
    findCell(ref: string): GridCell;
    /**
     * Given a cell ref, returns the GridCell object that represents the neighboring cell as per the specified
     * vector (direction) object, or null if no neighbor could be found.
     * @param ref
     * @param vector
     */
    findCellNeighbor(ref: string, vector: Point): GridCell;
    /**
     * Given a cell column ref and row ref, returns the GridCell object that represents the cell at the location,
     * or null if no cell could be found.
     * @param colRef
     * @param rowRef
     */
    locateCell(col: number, row: number): GridCell;
}
