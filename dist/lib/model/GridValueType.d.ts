import { GridCellData } from './GridCell';
/**
 * Represents the value type for a GridCell.
 */
export interface GridValueType {
    /**
     * The name of the type.
     */
    readonly name: string;
    /**
     * Accepts a raw string value and, if necessary, reformats it to a valid form for this
     * value type.  If the input is not valid for this value type, the value will be reset
     * to a constant value appropriate for the value type.
     */
    format(value: string, data: GridCellData): string;
    /**
     * Accepts a raw string value and converts it to a typed value according to the value
     * type.  Returns null if the input value is not valid.
     */
    convert(value: string, data: GridCellData): any;
}
/**
 * Standard GridValueType implementations.
 */
export declare const GridValueTypes: {
    string: GridValueType;
    number: GridValueType;
    date: GridValueType;
};
