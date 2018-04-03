import { Point } from '../geom/Point';
import { GridCellRefParts } from './GridCell';
export declare abstract class GridRef {
    /**
     * Compares two cell refs and returns -1 if a is less than b, 1 if a is greater than b, otherwise 0.
     *
     * @param a
     * @param b
     */
    static compare(a: string, b: string): number;
    /**
     * Determines whether or not the specified string is a valid cell reference.
     *
     * @param str
     */
    static valid(str: string): boolean;
    /**
     * Creates a cell reference string from the specified column and row references.
     *
     * @param col
     * @param row
     */
    static make(col: number, row: number): string;
    /**
     * Reads a cell reference string and returns the column and row reference values.
     *
     * @param cellRef
     */
    static unmake(cellRef: string): GridCellRefParts;
    /**
     * Reads a cell reference string and returns the column and row as the first and
     * second values in an array.
     *
     * @param cellRef
     */
    static unmakeToArray(cellRef: string): number[];
    /**
     * Creates a Point from a cell reference with the x as the column and y as the row.
     *
     * @param cellRef
     */
    static toPoint(cellRef: string): Point;
}
