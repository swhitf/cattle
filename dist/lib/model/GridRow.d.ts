import { GridObject } from './GridObject';
/**
 * Represents a grid row.
 */
export declare class GridRow extends GridObject {
    /**
     * The default height of a row; this can be altered.
     */
    static defaultHeight: number;
    /**
     * The row reference, must be unique per GridModel instance.  Used to indicate the position of the
     * row within the grid based on a zero-index.
     */
    readonly ref: number;
    /**
     * The height of the column.
     */
    height: number;
    /**
     * Initializes a new instance of DefaultGridRow.
     *
     * @param ref
     * @param height
     */
    constructor(ref: number, height?: number);
}
