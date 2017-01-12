/**
 * Defines the interface of an object that describes a GridColumn.
 */
export interface GridColumn
{
    /**
     * The column reference, must be unique per GridModel instance.  Used to indicate the position of the
     * column within the grid based on a zero-index.
     */
    readonly ref:number;

    /**
     * The width of the column.
     */
    width:number;
}