import { GridCellStyle } from './GridCellStyle';
import { GridObject } from './GridObject';
import { GridValueType } from './GridValueType';
/**
 * Defines the parameters that can/should be passed to a new GridCell instance.
 */
export interface GridCellParams {
    colRef: number;
    rowRef: number;
    value: string;
    valueType?: GridValueType;
    style?: string[];
    data?: GridCellData;
    type?: string;
    colSpan?: number;
    rowSpan?: number;
}
export declare type GridCellData = Readonly<{
    [key: string]: any;
}>;
export interface GridCellRefParts {
    readonly col: number;
    readonly row: number;
}
/**
 * Represents a cell within a grid.
 */
export declare class GridCell extends GridObject {
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
     * A bag of readonly key value pairs assocated with the cell.
     */
    data: GridCellData;
    /**
     * The style of the cell.
     */
    style: GridCellStyle;
    /**
     * The value of the cell.
     */
    value: string;
    /**
     * The value type of the cell.
     */
    valueType: GridValueType;
    /**
     * Initializes a new instance of DefaultGridCell.
     *
     * @param params
     */
    constructor(params: GridCellParams);
    /**
     * Gets the formatted value of the cell.
     */
    formattedValue(): string;
    /**
     * Gets the typed value of the cell.
     */
    typedValue(): any;
}
