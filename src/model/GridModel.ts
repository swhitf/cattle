import { GridColumn } from './GridColumn';
import { GridCell } from './GridCell';
import { GridRow } from './GridRow';
import { Point, PointInput } from '../geom/Point';


export type Vector = 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w';

/**
 * Defines the interface of an object that represents the logical composition of a data grid.  It hosts the
 * collections of the various entity model objects as well as methods for access and inspection.
 */
export interface GridModel
{
    /**
     * The grid cell definitions.  The order is arbitrary.
     */
    readonly cells:GridCell[];

    /**
     * The grid column definitions.  The order is arbitrary.
     */
    readonly columns:GridColumn[];

    /**
     * The grid row definitions.  The order is arbitrary.
     */
    readonly rows:GridRow[];

    /**
     * Given a cell ref, returns the GridCell object that represents the cell, or null if the cell did not exist
     * within the model.
     * @param ref
     */
    findCell(ref:string):GridCell;

    /**
     * Given a cell column ref and row ref, returns the GridCell object that represents the cell at the location,
     * or null if no cell could be found.
     * @param colRef
     * @param rowRef
     */
    locateCell(colRef:number, rowRef:number):GridCell;
    
    /**
     * From a given cell ref, walk once along the model in the specified vector.  Returns null if the model edge is
     * met.
     */
    walkOnce(ref:string, vector:PointInput|Vector):GridCell;

    /**
     * From a given cell ref, walk along the model at the specified step vector until a cell is reached that matches
     * the specified predicate.  Returns null if the model edge is met before an acceptable cell is found.
     */
    walkUntil(ref:string, vector:PointInput|Vector, predicate:(cell:GridCell) => boolean):GridCell;
}