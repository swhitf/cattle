import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { VoidCallback } from '../../common';
import { Point } from '../../geom/Point';
import * as dom from '../../misc/Dom';


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
            dom.on(view, 'mousedown', this.dragStart.bind(this)),
            dom.on(window, 'mousemove', this.drag.bind(this)),
            dom.on(window, 'mouseup', this.dragEnd.bind(this)),
        ];
    }

    public destroy():void
    {
        super.destroy();
        this.handles.forEach(x => x());
        this.handles = null;
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