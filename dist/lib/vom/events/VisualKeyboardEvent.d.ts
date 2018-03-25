import { Modifiers } from '../input/Modifiers';
import { Visual } from '../Visual';
import { VisualEvent } from './VisualEvent';
/**
 * Specifies the possible VisualKeyboardEvent values.
 */
export declare type VisualKeyboardEventTypes = 'keydown' | 'keypress' | 'keyup';
/**
 * Represents an event raised from a Visual object when a keyboard action is performed on the visual.
 */
export declare class VisualKeyboardEvent extends VisualEvent {
    /**
     * Specifies the key that was actioned
     */
    readonly key: number;
    /**
     * Specifies the char that was typed; only valid for keypress events.
     */
    readonly char: string;
    /**
     * An object describing the modifiers keys active during the event.
     */
    readonly modifiers: Modifiers;
    /**
     * Initializes a new instance of VisualKeyboardEvent.
     *
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     * @param key The key that was actioned.
     * @param modifiers An object describing the modifiers keys active during the event.
     */
    constructor(type: VisualKeyboardEventTypes, target: Visual, key: number, char: string, modifiers: Modifiers);
}
