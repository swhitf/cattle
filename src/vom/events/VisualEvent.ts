import { Event } from '../../base/Event';
import { Visual } from '../Visual';


/**
 * Represents an event raised from a Visual object.
 */
export class VisualEvent extends Event
{
    /**
     * Specifies the visual that the event was raised from.
     */
    public readonly target:Visual;

    /**
     * Initializes a new instance of VisualEvent.
     * 
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     */
    constructor(type:string, target:Visual)
    {
        super(type);

        this.target = target;
    }
}