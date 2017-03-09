import { GridModel } from '../../model/GridModel';
import { RectLike } from '../../geom/Rect';
export interface GridLayoutRegion<T> extends RectLike {
    readonly ref: T;
}
export declare class GridLayout {
    static compute(model: GridModel): GridLayout;
    readonly width: number;
    readonly height: number;
    readonly columns: GridLayoutRegion<number>[];
    readonly rows: GridLayoutRegion<number>[];
    readonly cells: GridLayoutRegion<string>[];
    private cellLookup;
    private columnIndex;
    private rowIndex;
    private cellIndex;
    private constructor(width, height, columns, rows, cells, cellLookup);
    queryColumn(ref: number): RectLike;
    queryRow(ref: number): RectLike;
    queryCell(ref: string): RectLike;
    captureColumns(region: RectLike): number[];
    captureRows(region: RectLike): number[];
    captureCells(region: RectLike): string[];
}
