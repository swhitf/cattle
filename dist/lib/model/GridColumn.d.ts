import { GridObject } from './GridObject';
/**
 * Represents a grid column.
 */
export declare class GridColumn extends GridObject {
    /**
     * The column reference, must be unique per GridModel instance.  Used to indicate the position of the
     * column within the grid based on a zero-index.
     */
    readonly ref: number;
    /**
     * The width of the column.
     */
    width: number;
    /**
     * Initializes a new instance of DefaultGridColumn.
     *
     * @param ref
     * @param width
     */
    constructor(ref: number, width?: number);
}
