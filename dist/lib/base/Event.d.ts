/**
 * Represents an event raised from an EventEmitter.
 */
export declare class Event {
    private canceledVal;
    /**
     * A string value that identifies the type of event.
     */
    readonly type: string;
    /**
     * Initializes a new instance of Event.
     *
     * @param type A string value that identifies the type of event.
     */
    constructor(type: string);
    /**
     * Indicates whether or not the event has been cancelled.
     */
    readonly canceled: boolean;
    /**
     * Cancels the event causing notification/propagation to stop.
     */
    cancel(): void;
}
