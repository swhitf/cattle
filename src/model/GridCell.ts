/**
 * Defines the interface of an object that represents a GridCell.
 */
export interface GridCell
{
    /**
     * The cell reference, must be unique per GridModel instance.
     */
    readonly ref:string;

    /**
     * The column reference that describes the horizontal position of the cell.
     */
    readonly colRef:number;

    /**
     * The number of columns that this cell spans.
     */
    readonly colSpan:number;

    /**
     * The row reference that describes the vertical position of the cell.
     */
    readonly rowRef:number;

    /**
     * The number of rows that this cell spans.
     */
    readonly rowSpan:number;

    /**
     * The value of the cell.
     */
    value:string;
}