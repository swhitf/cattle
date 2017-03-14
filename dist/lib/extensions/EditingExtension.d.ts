import { GridCell } from '../model/GridCell';
import { GridKernel } from './../ui/GridKernel';
import { GridElement } from './../ui/GridElement';
import { Widget } from '../ui/Widget';
export interface GridEditEvent {
    changes: GridEditIntent[];
}
export interface GridEditIntent {
    cell: GridCell;
    value: string;
}
export interface InputWidget extends Widget {
    focus(): void;
    val(value?: string): string;
}
export declare class EditingExtension {
    private grid;
    private layer;
    private input;
    private isEditing;
    private isEditingDetailed;
    init(grid: GridElement, kernel: GridKernel): void;
    private readonly primarySelector;
    private readonly selection;
    private createElements(target);
    private beginEdit(override);
    private endEdit(commit?);
    private endEditToNeighbor(vector, commit?);
    private erase();
    private commitUniform(cells, uniformValue);
    private commit(changes);
}
