import { Camera } from '../Camera';
import { Point } from '../../geom/Point';
import { Visual } from '../Visual';
import { KeySet } from '../input/KeySet';
import { VisualEvent } from './VisualEvent';


/**
 * Specifies the possible VisualMouseEventTypes values.
 */
export type VisualMouseEventTypes = 'mousedown'|'mousemove'|'mouseup'|'mouseenter'|'mouseleave'|'click'|'dblclick';

/**
 * Represents an event raised from a Visual object when a mouse action is performed on the visual.
 */
export class VisualMouseEvent extends VisualEvent
{
    /**
     * The camera on which the mouse gesture was performed.
     */
    public readonly camera:Camera;
    
    /**
     * The position of the mouse relative to the surface when the event was raised.
     */
    public readonly surfacePoint:Point;

    /**
     * If applicable the button that was actioned.
     */
    public readonly button:number;
    
    /**
     * An object describing the current state of all keys.
     */
    public readonly keys:KeySet;
    
    /**
     * Initializes a new instance of VisualMouseEvent.
     * 
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     * @param camera The camera on which the mouse gesture was performed.
     * @param surfacePoint The position of the mouse relative to the surface when the event was raised.
     * @param button If applicable the button that was actioned.
     * @param keys An object describing the current state of all keys.
     */
    constructor(type:VisualMouseEventTypes, target:Visual, camera:Camera, surfacePoint:Point, button:number, keys:KeySet)
    {
        super(type, target); 
        
        this.camera = camera;
        this.surfacePoint = surfacePoint;
        this.button = button;
        this.keys = keys;
    }
}