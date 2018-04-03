import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { GridExtension } from '../../core/Extensibility';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { HintProvider } from './HintProvider';
export declare class HintExtension extends AbstractDestroyable implements GridExtension {
    private providers;
    private grid;
    constructor(providers: HintProvider[]);
    init(grid: GridElement, kernel: GridKernel): void;
    private readonly editInput;
    private readonly primarySelection;
    private onEditInputKeyPress(e);
    private onEditInputKeyUp(e);
    private doSuggestion();
    private getSuggestion(cell, input);
}
