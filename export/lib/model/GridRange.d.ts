import { GridCell } from './GridCell';
import { GridModel } from './GridModel';
import { Point } from '../geom/Point';
/**
 * Describes a resolveExpr of grid cells.
 */
export declare class GridRange {
    /**
     * Creates a new GridRange object that contains the cells with the specified refs from the
     * specified model.
     *
     * @param model
     * @param cellRefs
     * @returns {Range}
     */
    static create(model: GridModel, cellRefs: string[]): GridRange;
    /**
     * Selects a resolveExpr of cells from the specified model based on the specified vectors.  The vectors should be
     * two points in grid coordinates (e.g. col and row references) that draw a logical line across the grid.
     * Any cells falling into the rectangle created from these two points will be included in the selected resolveExpr.
     *
     * @param model
     * @param from
     * @param to
     * @param toInclusive
     * @returns {Range}
     */
    static select(model: GridModel, from: Point, to: Point, toInclusive?: boolean): GridRange;
    /**
     * Creates an empty GridRange object.
     *
     * @returns {Range}
     */
    static empty(): GridRange;
    /**
     * The cells in the resolveExpr ordered from left to right.
     */
    readonly ltr: GridCell[];
    /**
     * The cells in the resolveExpr ordered from top to bottom.
     */
    readonly ttb: GridCell[];
    /**
     * With width of the resolveExpr in columns.
     */
    readonly width: number;
    /**
     * With height of the resolveExpr in rows.
     */
    readonly height: number;
    /**
     * The number of cells in the resolveExpr (will be different to length if some cell slots contain no cells).
     */
    readonly count: number;
    /**
     * The length of the resolveExpr (number of rows * number of columns).
     */
    readonly length: number;
    private constructor(values);
}
