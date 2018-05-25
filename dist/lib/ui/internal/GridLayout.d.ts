import { Padding } from '../../geom/Padding';
import { RectLike } from '../../geom/Rect';
import { GridModel } from '../../model/GridModel';
export interface GridLayoutRegion<T> extends RectLike {
    readonly ref: T;
}
export declare class GridLayout {
    static compute(model: GridModel, padding: Padding): GridLayout;
    readonly width: number;
    readonly height: number;
    readonly columns: GridLayoutRegion<number>[];
    readonly rows: GridLayoutRegion<number>[];
    readonly cells: GridLayoutRegion<string>[];
    private cellLookup;
    private columnIndex;
    private rowIndex;
    private cellIndex;
    private constructor();
    queryColumn(ref: number): RectLike;
    queryColumnRange(fromRef: number, toRefEx: number): RectLike;
    queryRow(ref: number): RectLike;
    queryRowRange(fromRef: number, toRefEx: number): RectLike;
    queryCell(ref: string): RectLike;
    captureColumns(region: RectLike): number[];
    captureRows(region: RectLike): number[];
    captureCells(region: RectLike): string[];
}
