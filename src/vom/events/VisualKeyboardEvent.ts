import { Visual } from '../Visual';
import { KeySet } from '../input/KeySet';
import { VisualEvent } from './VisualEvent';


/**
 * Specifies the possible VisualKeyboardEvent values.
 */
export type VisualKeyboardEventTypes = 'keydown'|'keyup';

/**
 * Represents an event raised from a Visual object when a keyboard action is performed on the visual.
 */
export class VisualKeyboardEvent extends VisualEvent
{
    /**
     * Specifies the key that was actioned
     */
    public readonly key:number;

    /**
     * An object describing the current state of all keys
     */
    public readonly keys:KeySet;

    /**
     * Initializes a new instance of VisualKeyboardEvent.
     * 
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     * @param key The key that was actioned.
     * @param keys An object describing the current state of all keys.
     */
    constructor(type:VisualKeyboardEventTypes, target:Visual, key:number, keys:KeySet)
    {
        super(type, target); 
        
        this.key = key;
        this.keys = keys;
    }
}