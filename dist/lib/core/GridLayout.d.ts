import { PointLike } from '../geom/Point';
import { Padding } from '../geom/Padding';
import { RectLike } from '../geom/Rect';
import { GridCell } from '../model/GridCell';
import { GridColumn } from '../model/GridColumn';
import { GridModel } from '../model/GridModel';
import { GridRow } from '../model/GridRow';
export interface GridLayoutRegion<T> extends RectLike {
    readonly object: T;
}
export declare class GridLayout {
    static empty: GridLayout;
    static compute(model: GridModel, padding: Padding): GridLayout;
    readonly width: number;
    readonly height: number;
    readonly columns: GridLayoutRegion<GridColumn>[];
    readonly rows: GridLayoutRegion<GridRow>[];
    readonly cells: GridLayoutRegion<GridCell>[];
    private cellLookup;
    private columnIndex;
    private rowIndex;
    private cellIndex;
    private constructor();
    captureColumns(region: RectLike): GridColumn[];
    captureRows(region: RectLike): GridRow[];
    captureCells(region: RectLike): GridCell[];
    measureColumn(ref: number): RectLike;
    measureColumnRange(fromRef: number, toRefEx: number): RectLike;
    measureRow(ref: number): RectLike;
    measureRowRange(fromRef: number, toRefEx: number): RectLike;
    measureCell(ref: string): RectLike;
    pickColumn(at: PointLike): GridColumn;
    pickRow(at: PointLike): GridRow;
    pickCell(at: PointLike): GridCell;
}
