export interface HistoryAction {
    apply(): void;
    rollback(): void;
}
export interface HistoryManager {
    readonly futureCount: number;
    readonly pastCount: number;
    clear(): void;
    push(action: HistoryAction): void;
    redo(): boolean;
    undo(): boolean;
}
export declare class DefaultHistoryManager implements HistoryManager {
    private future;
    private past;
    readonly futureCount: number;
    readonly pastCount: number;
    clear(): void;
    push(action: HistoryAction): void;
    redo(): boolean;
    undo(): boolean;
}
