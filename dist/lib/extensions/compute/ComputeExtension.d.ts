import { ComputeEngine } from './ComputeEngine';
import { GridExtension, GridElement } from '../../ui/GridElement';
import { GridKernel } from '../../ui/GridKernel';
import { GridCell } from '../../model/GridCell';
export interface GridCellWithFormula extends GridCell {
    formula: string;
}
export declare class ComputeExtension implements GridExtension {
    protected readonly engine: ComputeEngine;
    private noCapture;
    private grid;
    constructor(engine?: ComputeEngine);
    private readonly selection;
    init?(grid: GridElement, kernel: GridKernel): void;
    private reload();
    private beginEditOverride(override, impl);
    private commitOverride(changes, impl);
}
