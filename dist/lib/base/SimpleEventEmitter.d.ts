import { Destroyable } from './Destroyable';
import { Event } from './Event';
import { EventCallback, EventEmitter } from './EventEmitter';
export declare class SimpleEventEmitter implements EventEmitter {
    private buckets;
    on(event: string, callback: EventCallback): Destroyable;
    off(event: string, callback?: EventCallback): void;
    emit(evt: Event): void;
    private getCallbackList(event);
}
