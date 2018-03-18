import { HistoryAction, HistoryManager } from './HistoryManager';
export declare class DefaultHistoryManager implements HistoryManager {
    private future;
    private past;
    readonly futureCount: number;
    readonly pastCount: number;
    clear(): void;
    apply(action: HistoryAction): void;
    push(action: HistoryAction): void;
    redo(): boolean;
    undo(): boolean;
}
