export declare class WatchManager {
    private observing;
    private observed;
    constructor();
    clear(): void;
    getObserversOf(cellRef: string): string[];
    getObservedBy(cellRef: string): string[];
    watch(observer: string, subjects: string[]): void;
    unwatch(observer: string): void;
}
