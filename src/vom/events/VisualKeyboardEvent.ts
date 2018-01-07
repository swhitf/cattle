import { Modifiers } from '../input/Modifiers';
import { Visual } from '../Visual';
import { VisualEvent } from './VisualEvent';


/**
 * Specifies the possible VisualKeyboardEvent values.
 */
export type VisualKeyboardEventTypes = 'keydown'|'keypress'|'keyup';

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
     * Specifies the char that was typed; only valid for keypress events.
     */
    public readonly char:string;

    /**
     * An object describing the modifiers keys active during the event.
     */
    public readonly modifiers:Modifiers;

    /**
     * Initializes a new instance of VisualKeyboardEvent.
     * 
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     * @param key The key that was actioned.
     * @param modifiers An object describing the modifiers keys active during the event.
     */
    constructor(type:VisualKeyboardEventTypes, target:Visual, key:number, char:string, modifiers:Modifiers)
    {
        super(type, target); 
        
        this.key = key;
        this.char = char;
        this.modifiers = modifiers;
    }
}