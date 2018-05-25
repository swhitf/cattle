import { GridCell } from '../../model/GridCell';
import { GridElement } from '../../ui/GridElement';
import { GridChangeSet } from '../common/EditingExtension';
import { ComputeEngine } from './ComputeEngine';
export interface CompiledFormula {
    (changeScope?: GridChangeSet): number;
}
export declare class JavaScriptComputeEngine implements ComputeEngine {
    private grid;
    private formulas;
    private cache;
    private watches;
    getFormula(cellRef: string): string;
    clear(cellRefs?: string[]): void;
    connect(grid: GridElement): void;
    evaluate(formula: string, changeScope?: GridChangeSet): string;
    compute(cellRefs?: string[], scope?: GridChangeSet, cascade?: boolean): GridChangeSet;
    inspect(formula: string): string[];
    program(cellRef: string, formula: string): void;
    protected compile(formula: string): CompiledFormula;
    protected cascadeTargets(cells: GridCell[]): GridCell[];
    protected resolve(expr: string, changeScope: GridChangeSet): number | number[];
    private coalesceFloat(...values);
}
