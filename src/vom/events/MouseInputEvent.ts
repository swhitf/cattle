import { Point } from '../../geom/Point';
import { Visual } from '../Visual';
import { KeySet } from './KeySet';
import { VisualEvent } from './VisualEvent';


export type MouseInputEventTypes = 'mousedown'|'mousemove'|'mouseup'|'mouseenter'|'mouseleave';

export class MouseInputEvent extends VisualEvent
{
    public readonly button:number;
    public readonly surfacePoint:Point;
    public readonly viewPoint:Point;
    public readonly keys:KeySet;
    public readonly target:Visual;

    constructor(type:MouseInputEventTypes, target:Visual, button:number, viewPoint:Point, surfacePoint:Point, keys:KeySet)
    {
        super(type, target); 
        
        this.button = button;
        this.viewPoint = viewPoint;
        this.surfacePoint = surfacePoint;
        this.keys = keys;
        this.target = target;
    }
}