import { GridCellStyle } from './GridCellStyle';
import { GridObject } from './GridObject';
/**
 * Defines the parameters that can/should be passed to a new GridCell instance.
 */
export interface GridCellParams {
    colRef: number;
    rowRef: number;
    value: string;
    style?: string[];
    type?: string;
    colSpan?: number;
    rowSpan?: number;
}
export interface GridCellRefParts {
    readonly col: number;
    readonly row: number;
}
/**
 * Represents a cell within a grid.
 */
export declare class GridCell extends GridObject {
    /**
     * Determines whether or not the specified string is a valid cell reference.
     *
     * @param str
     */
    static isRef(str: string): boolean;
    /**
     * Creates a cell reference string from the specified column and row references.
     *
     * @param col
     * @param row
     */
    static makeRef(col: number, row: number): string;
    /**
     * Reads a cell reference string and returns the column and row reference values.
     *
     * @param cellRef
     */
    static unmakeRef(cellRef: string): GridCellRefParts;
    /**
     * Reads a cell reference string and returns the column and row as the first and
     * second values in an array.
     *
     * @param cellRef
     */
    static unmakeRefToArray(cellRef: string): number[];
    /**
     * The cell ref, an excel-like reference to the location of the cell.
     */
    readonly ref: string;
    /**
     * User specified cell that specifies the cell type; this is an arbitrary string that intended
     * to help with customization.
     */
    readonly type: string;
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
     * The style of the cell.
     */
    style: GridCellStyle;
    /**
     * The value of the cell.
     */
    value: string;
    /**
     * Initializes a new instance of DefaultGridCell.
     *
     * @param params
     */
    constructor(params: GridCellParams);
}
