import { GridColumn } from '../GridColumn';
/**
 * Provides a by-the-book implementation of GridColumn.
 */
export declare class DefaultGridColumn implements GridColumn {
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
