import { GridCell } from '../../model/GridCell';
import { GridModel } from '../../model/GridModel';
import { Widget } from '../../ui/Widget';
import { GridElement } from '.././../ui/GridElement';
import { GridKernel } from '.././../ui/GridKernel';
export interface GridEditEvent {
    changes: GridChange[];
}
export interface GridChange {
    readonly cell: GridCell;
    readonly value: string;
    readonly cascaded?: boolean;
}
export interface GridChangeSetVisitor {
    (ref: string, val: string, cascaded: boolean): void;
}
export interface GridChangeSetItem {
    readonly ref: string;
    readonly value: string;
    readonly cascaded?: boolean;
}
export declare class GridChangeSet {
    private data;
    contents(): GridChangeSetItem[];
    get(ref: string): string;
    put(ref: string, value: string, cascaded?: boolean): GridChangeSet;
    refs(): string[];
    compile(model: GridModel): GridChange[];
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
