import { Event } from "./Event";
import { EventEmitter, EventCallback } from "./EventEmitter";
import { Destroyable } from "./Destroyable";
export declare class SimpleEventEmitter implements EventEmitter {
    private buckets;
    on(event: string, callback: EventCallback): Destroyable;
    off(event: string, callback?: EventCallback): void;
    emit(evt: Event): void;
    private getCallbackList(event);
}
