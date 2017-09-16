import { Point } from '../../geom/Point';
import { Visual } from '../Visual';
import { KeySet } from '../input/KeySet';
import { VisualEvent } from './VisualEvent';


/**
 * Specifies the possible VisualMouseEventTypes values.
 */
export type VisualMouseEventTypes = 'mousedown'|'mousemove'|'mouseup'|'mouseenter'|'mouseleave';

/**
 * Represents an event raised from a Visual object when a mouse action is performed on the visual.
 */
export class VisualMouseEvent extends VisualEvent
{
    /**
     * If applicable the button that was actioned.
     */
    public readonly button:number;
    
    /**
     * The position of the mouse relative to the surface when the event was raised.
     */
    public readonly surfacePoint:Point;
    
    /**
     * The position of the mouse relative to the view when the event was raised.
     */
    public readonly viewPoint:Point;
    
    /**
     * An object describing the current state of all keys.
     */
    public readonly keys:KeySet;
    
    /**
     * Initializes a new instance of VisualMouseEvent.
     * 
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     * @param button If applicable the button that was actioned.
     * @param viewPoint The position of the mouse relative to the view when the event was raised.
     * @param surfacePoint The position of the mouse relative to the surface when the event was raised.
     * @param keys An object describing the current state of all keys.
     */
    constructor(type:VisualMouseEventTypes, target:Visual, button:number, viewPoint:Point, surfacePoint:Point, keys:KeySet)
    {
        super(type, target); 
        
        this.button = button;
        this.viewPoint = viewPoint;
        this.surfacePoint = surfacePoint;
        this.keys = keys;
    }
}