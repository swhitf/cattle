import { GridElement, GridExtension } from '../../ui/GridElement';
import { GridKernel } from '../../ui/GridKernel';
import { HistoryManager } from './HistoryManager';
export declare class HistoryExtension implements GridExtension {
    private grid;
    private manager;
    private noCapture;
    private suspended;
    private capture;
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
