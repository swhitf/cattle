import { Point } from '../geom/Point';
import { GridCell } from './GridCell';
import { GridModel } from './GridModel';
/**
 * Specifies that an object has properties like those on the `GridRange` class.
 */
export interface GridRangeLike {
    /**
     * The cells in the GridRange ordered from left to right.
     */
    readonly ltr: GridCell[];
    /**
     * The width of the GridRange in columns.
     */
    readonly width: number;
    /**
     * The height of the GridRange in rows.
     */
    readonly height: number;
    /**
     * The length of the GridRange (number of rows * number of columns).
     */
    readonly length: number;
}
/**
 * Provides a method of selecting and representing a range of cells from a `GridModel`.  GridRanges
 * will always be rectangular and contain no gaps unless there are cells missing.
 */
export declare class GridRange implements GridRangeLike {
    /**
     * Creates a new GridRange object from the specified cellRefs by expanding the list to
     * include those that fall within the rectangle of the upper left most and lower right
     * most two cells in the list.  In the example below C2, D2, D3 and E3 will be expanded
     * to also include E2 and C3.
     *
     * A B C D E F
     * 1
     * 2   X X ^
     * 3   ^ X X
     * 4
     * 5
     *
     * @param model
     * @param cellRefs
     * @returns {Range}
     */
    static fromRefs(model: GridModel, cellRefs: string[]): GridRange;
    /**
     * Returns a GridRange that includes all cells captured by computing a rectangle around the
     * specified cell coordinates.
     *
     * @param model
     * @param points
     */
    static fromPoints(model: GridModel, points: Point[]): GridRange;
    /**
     * Selects a range of cells using an Excel-like range expression. For example:
     * - A1 selects a 1x1 range of the first cell
     * - A1:A5 selects a 1x5 range from the first cell horizontally.
     * - A1:E5 selects a 5x5 range from the first cell evenly.
     *
     * @param model
     * @param query
     */
    static fromQuery(model: GridModel, query: string): GridRange;
    /**
     * Creates an empty GridRange object.
     *
     * @returns {Range}
     */
    static empty(): GridRange;
    private static createInternal(model, cells);
    /**
     * The cells in the GridRange ordered from left to right.
     */
    readonly ltr: GridCell[];
    /**
     * The width of the GridRange in columns.
     */
    readonly width: number;
    /**
     * The height of the GridRange in rows.
     */
    readonly height: number;
    /**
     * The length of the GridRange (number of rows * number of columns).
     */
    readonly length: number;
    private index;
    private constructor();
    /**
     * Indicates whether or not a cell is included in the range.
     */
    contains(cellRef: string): boolean;
    /**
     * Returns an array of the references for all the cells in the range.
     */
    refs(): string[];
    /**
     * Returns the first cell in the range.
     */
    first(): GridCell;
    /**
     * Returns the last cell in the range.
     */
    last(): GridCell;
}
