import { Visual } from '../Visual';
import { VisualEvent } from './VisualEvent';


/**
 * Represents an event raised from a Visual object when a property on the visual changes value.
 */
export class VisualChangeEvent extends VisualEvent
{
    /**
     * Specifies the name of the property that changed.
     */
    public readonly property:string;

    /**
     * Initializes a new instance of VisualChangeEvent.
     * 
     * @param target The visual that the event was raised from.
     * @param property The name of the property that changed. 
     */
    constructor(target:Visual, property:string)
    {
        super('change', target);
        this.property = property;
    }
}