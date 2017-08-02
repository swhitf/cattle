export interface EventSubscription {
    cancel(): void;
}
export interface EventCallback {
    (...args: any[]): void;
}
export interface EventEmitter {
    on(event: string, callback: EventCallback): EventSubscription;
    off(event: string, callback: EventCallback): void;
    emit(event: string, ...args: any[]): void;
}
export declare class EventEmitterBase {
    private buckets;
    on(event: string, callback: EventCallback): EventSubscription;
    off(event: string, callback: EventCallback): void;
    emit(event: string, ...args: any[]): void;
    private getCallbackList(event);
}
