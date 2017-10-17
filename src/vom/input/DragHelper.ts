import { VoidCallback } from '../../common';
import { Point } from '../../geom/Point';
import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { Surface } from '../Surface';


export interface DragHelperCallback
{
    (me:MouseEvent, distance:Point):void;
}

export class DragHelper extends AbstractDestroyable
{
    private dragging:boolean;
    private previous:Point;

    private handles:VoidCallback[];

    constructor(view:HTMLElement, private handler:DragHelperCallback)
    {
        super();

        this.handles = [
            listen(view, 'mousedown', this.dragStart.bind(this)),
            listen(window, 'mousemove', this.drag.bind(this)),
            listen(window, 'mouseup', this.dragEnd.bind(this)),
        ];
    }
    
    private dragStart(me:MouseEvent):void
    {
        this.dragging = true;
        this.previous = new Point(me.screenX, me.screenY);
    }
    
    private drag(me:MouseEvent):void
    {
        if (this.dragging)
        {   
            let screenPt = new Point(me.screenX, me.screenY);
            let distance = screenPt.subtract(this.previous);

            this.handler(me, distance);

            this.previous = screenPt;
        }
    }
    
    private dragEnd(me:MouseEvent):void
    {
        this.dragging = false;
        this.previous = null;
    }
}

function listen(target:EventTarget, name:string, callback:any):VoidCallback
{
    target.addEventListener(name, callback);
    return () => target.removeEventListener(name, callback);
}