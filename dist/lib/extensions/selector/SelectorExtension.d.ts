import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { Point } from '../../geom/Point';
export interface SelectorExtensionExports {
    canSelect: boolean;
    readonly selections: string[][];
    readonly primarySelection: string[];
    select(cells: string[], autoScroll?: boolean): void;
    selectAll(): void;
    selectBorder(vector: Point, autoScroll?: boolean): void;
    selectEdge(vector: Point, autoScroll?: boolean): void;
    selectLine(gridPt: Point, autoScroll?: boolean): void;
    selectNeighbor(vector: Point, autoScroll?: boolean): void;
}
export declare type SelectNextTargetType = 'cell' | 'dataPoint' | 'edge';
export interface Selection {
    readonly from: string;
    readonly to: string;
}
export declare enum SelectMode {
    Default = "default",
    Extend = "extend",
    Append = "append",
}
export declare class SelectorExtension {
    private grid;
    private kernel;
    private canSelect;
    private selections;
    init(grid: GridElement, kernel: GridKernel): void;
    private readonly nets;
    private readonly primarySelection;
    private select(from, to, mode?);
    private select(cell, mode?);
    private selectNext(type, vector, mode?);
    private doSelect(from, to, mode?);
    private doSelect(cell, mode?);
    private doVisualizeSelection();
    private resolveTarget(fromRef, target, vector);
}
