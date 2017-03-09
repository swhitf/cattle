import { GridChangeSet } from '../common/EditingExtension';
import { GridElement } from '../../ui/GridElement';
export interface ComputeEngine {
    getFormula(cellRef: string): string;
    clear(cellRefs?: string[]): void;
    connect(grid: GridElement): void;
    compute(cellRefs?: string[], scope?: GridChangeSet, cascade?: boolean): GridChangeSet;
    evaluate(formula: string): string;
    inspect(formula: string): string[];
    program(cellRef: string, formula: string): void;
}
