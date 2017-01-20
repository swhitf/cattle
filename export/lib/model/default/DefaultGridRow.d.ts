import { GridRow } from '../GridRow';
/**
 * Provides a by-the-book implementation of GridRow.
 */
export declare class DefaultGridRow implements GridRow {
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
