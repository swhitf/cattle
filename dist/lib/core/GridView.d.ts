import { Surface } from '../vom/Surface';
import { PointLike } from '../geom/Point';
import { RectLike } from '../geom/Rect';
import { GridCell } from '../model/GridCell';
import { GridColumn } from '../model/GridColumn';
import { GridRow } from '../model/GridRow';
import { GridLayout } from './GridLayout';
export declare class GridView {
    private layout;
    private surface;
    constructor(layout: GridLayout, surface: Surface);
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
