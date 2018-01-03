import { Modifiers } from '../input/Modifiers';
import { Point } from '../../geom/Point';
import { Camera } from '../Camera';
import { Visual } from '../Visual';
import { VisualMouseEvent } from './VisualMouseEvent';


/**
 * Represents an event raised from a Visual object when the mouse is dragged over the visual.
 */
export class VisualMouseDragEvent extends VisualMouseEvent
{
    /**
     * The distance the mouse has been dragged since the start of the drag gesture.
     */
    public readonly distance:Point;
    
    /**
     * Initializes a new instance of VisualMouseDragEvent.
     * 
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     * @param camera The camera on which the mouse gesture was performed.
     * @param surfacePoint The position of the mouse relative to the surface when the event was raised.
     * @param button If applicable the button that was actioned.
     * @param modifiers An object describing the modifiers keys active during the event.
     * @param distance The distance the mouse has been dragged since the start of the drag gesture.
     */
    constructor(target:Visual, camera:Camera, surfacePoint:Point, button:number, modifiers:Modifiers, distance:Point)
    {
        super('mousedrag', target, camera, surfacePoint, button, modifiers); 
        
        this.distance = distance;
    }
}