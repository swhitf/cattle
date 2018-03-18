import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { HistoryManager } from './HistoryManager';
export declare class HistoryExtension {
    private grid;
    private manager;
    private capture;
    private noCapture;
    private suspended;
    constructor(manager?: HistoryManager);
    init(grid: GridElement, kernel: GridKernel): void;
    private undo();
    private redo();
    private push(action);
    private clear();
    private suspend(flag?);
    private beforeCommit(changes);
    private afterCommit(changes);
    private createSnapshots(capture, changes);
    private createEditAction(snapshots);
    private invokeSilentCommit(changes);
}
