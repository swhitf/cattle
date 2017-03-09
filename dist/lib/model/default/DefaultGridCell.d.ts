import { GridCell } from '../GridCell';
/**
 * Defines the parameters that can/should be passed to a new DefaultGridCell instance.
 */
export interface DefaultGridCellParams {
    colRef: number;
    rowRef: number;
    value: string;
    ref?: string;
    colSpan?: number;
    rowSpan?: number;
}
/**
 * Provides a by-the-book implementation of GridCell.
 */
export declare class DefaultGridCell implements GridCell {
    /**
     * The cell reference, must be unique per GridModel instance.
     */
    readonly ref: string;
    /**
     * The column reference that describes the horizontal position of the cell.
     */
    readonly colRef: number;
    /**
     * The number of columns that this cell spans.
     */
    readonly colSpan: number;
    /**
     * The row reference that describes the vertical position of the cell.
     */
    readonly rowRef: number;
    /**
     * The number of rows that this cell spans.
     */
    readonly rowSpan: number;
    /**
     * The value of the cell.
     */
    value: string;
    /**
     * Initializes a new instance of DefaultGridCell.
     *
     * @param params
     */
    constructor(params: DefaultGridCellParams);
}
