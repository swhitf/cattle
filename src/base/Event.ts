

/**
 * Represents an event raised from an EventEmitter.
 */
export class Event
{
    private canceledVal:boolean = false;

    /**
     * A string value that identifies the type of event.
     */
    public readonly type:string;

    /**
     * Initializes a new instance of Event.
     * 
     * @param type A string value that identifies the type of event.
     */
    constructor(type:string)
    {
        this.type = type;
    }
    
    /**
     * Indicates whether or not the event has been cancelled.
     */
    public get canceled():boolean
    {
        return this.canceledVal;
    }

    /**
     * Cancels the event causing notification/propagation to stop.
     */
    public cancel():void
    {
        this.canceledVal = true;
    }
}