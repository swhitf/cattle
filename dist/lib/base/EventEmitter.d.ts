import { Event } from './Event';
import { Destroyable } from './Destroyable';
export interface EventCallback {
    (evt: Event): void;
}
export interface EventEmitter {
    on(event: string, callback: EventCallback): Destroyable;
    off(event: string, callback?: EventCallback): void;
    emit(evt: Event): void;
}
export declare function debug_events(ee: EventEmitter): void;
