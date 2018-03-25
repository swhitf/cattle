import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
export declare class EditingExtension extends AbstractDestroyable {
    private autoApply;
    private grid;
    private input;
    private state;
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
