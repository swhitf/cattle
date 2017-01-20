import { EventEmitter, EventCallback, EventSubscription } from '../ui/internal/EventEmitter';
export declare class EventTargetEventEmitterAdapter implements EventEmitter {
    private target;
    static wrap(target: EventTarget | EventEmitter): EventEmitter;
    constructor(target: EventTarget);
    on(event: string, callback: EventCallback): EventSubscription;
    off(event: string, callback: EventCallback): void;
    emit(event: string, ...args: any[]): void;
}
