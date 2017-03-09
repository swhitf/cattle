import { GridExtension, GridElement } from '../../ui/GridElement';
import { GridKernel } from '../../ui/GridKernel';
export interface HistoryAction {
    apply(): void;
    rollback(): void;
}
export declare class HistoryExtension implements GridExtension {
    private grid;
    private future;
    private past;
    private noCapture;
    private capture;
    init(grid: GridElement, kernel: GridKernel): void;
    private undo();
    private redo();
    private push(action);
    private clearHistory();
    private beforeCommit(changes);
    private afterCommit(changes);
    private createSnapshots(capture, changes);
    private createEditAction(snapshots);
    private invokeSilentCommit(changes);
}
