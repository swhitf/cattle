import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
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
export declare class SelectorExtension extends AbstractDestroyable {
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
    private selectAll();
    private doSelect(from, to, mode?);
    private doSelect(cell, mode?);
    private doVisualizeSelection();
    private resolveTarget(fromRef, target, vector);
}
