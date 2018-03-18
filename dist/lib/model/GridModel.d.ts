import { GridColumn } from './GridColumn';
import { GridCell } from './GridCell';
import { GridRow } from './GridRow';
import { Point } from '../geom/Point';
/**
 * Represents the logical composition of a grid.  It hosts the collections of the various entity model
 * objects as well as methods for access and inspection.  All inspection methods use O(1) implementations.
 */
export declare class GridModel {
    /**
     * Creates an grid model with the specified number of columns and rows populated with default cells.
     *
     * @param cols
     * @param rows
     */
    static dim(width: number, height: number): GridModel;
    /**
     * Creates an empty grid model.
     *
     * @returns {GridModel}
     */
    static empty(): GridModel;
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
    private byId;
    private byCoord;
    private dims;
    /**
     * Initializes a new instance of GridModel.
     *
     * @param cells
     * @param columns
     * @param rows
     */
    constructor(cells: GridCell[], columns: GridColumn[], rows: GridRow[]);
    /**
     * Gets the width of the model in columns.
     */
    readonly width: number;
    /**
     * Gets the height of the model in rows.
     */
    readonly height: number;
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
    /**
     * Refreshes internal caches used to optimize lookups and should be invoked after the model has been changed (structurally).
     */
    refresh(): void;
}
