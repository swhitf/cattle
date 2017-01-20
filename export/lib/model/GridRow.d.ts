/**
 * Defines the interface of an object that describes a GridRow.
 */
export interface GridRow {
    /**
     * The row reference, must be unique per GridModel instance.  Used to indicate the position of the
     * row within the grid based on a zero-index.
     */
    readonly ref: number;
    /**
     * The height of the column.
     */
    height: number;
}
