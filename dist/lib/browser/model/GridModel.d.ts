import { GridColumn } from './GridColumn';
import { GridCell } from './GridCell';
import { GridRow } from './GridRow';
import { Point } from '../geom/Point';
/**
 * Defines the interface of an object that represents the logical composition of a data grid.  It hosts the
 * collections of the various entity model objects as well as methods for access and inspection.
 */
export interface GridModel {
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
    locateCell(colRef: number, rowRef: number): GridCell;
}
