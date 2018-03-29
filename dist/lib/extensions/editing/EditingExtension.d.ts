import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { EventEmitter } from '../../base/EventEmitter';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
export interface GridInputRange {
    start: number;
    end: number;
}
export interface GridInput extends EventEmitter {
    readonly range: GridInputRange;
    val(value?: string, range?: GridInputRange): string;
}
export declare class EditingExtension extends AbstractDestroyable {
    private autoApply;
    private grid;
    private state;
    private input;
    constructor(autoApply?: boolean);
    init(grid: GridElement, kernel: GridKernel): void;
    private readonly primarySelection;
    private readonly selections;
    private commitUniform(cellRefs, uniformValue);
    private commit(changes);
    private doBeginEdit(override?);
    private doEndEdit(commit?);
    private erase();
    private doCommit(changes);
    private computeInputRect();
    private endEditToNeighbor(vector);
}
