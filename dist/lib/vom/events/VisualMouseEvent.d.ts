import { Modifiers } from '../input/Modifiers';
import { Camera } from '../Camera';
import { Point } from '../../geom/Point';
import { Visual } from '../Visual';
import { VisualEvent } from './VisualEvent';
/**
 * Specifies the possible VisualMouseEventTypes values.
 */
export declare type VisualMouseEventTypes = 'mousedown' | 'mousemove' | 'mouseup' | 'mousedrag' | 'mouseenter' | 'mouseleave' | 'click' | 'dblclick';
/**
 * Represents an event raised from a Visual object when a mouse action is performed on the visual.
 */
export declare class VisualMouseEvent extends VisualEvent {
    /**
     * The camera on which the mouse gesture was performed.
     */
    readonly camera: Camera;
    /**
     * The position of the mouse relative to the surface when the event was raised.
     */
    readonly surfacePoint: Point;
    /**
     * If applicable the button that was actioned.
     */
    readonly button: number;
    /**
     * An object describing the modifiers keys active during the event.
     */
    readonly modifiers: Modifiers;
    /**
     * Initializes a new instance of VisualMouseEvent.
     *
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     * @param camera The camera on which the mouse gesture was performed.
     * @param surfacePoint The position of the mouse relative to the surface when the event was raised.
     * @param button If applicable the button that was actioned.
     * @param modifiers An object describing the modifiers keys active during the event.
     */
    constructor(type: VisualMouseEventTypes, target: Visual, camera: Camera, surfacePoint: Point, button: number, modifiers: Modifiers);
}
