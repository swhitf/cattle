import { Point } from '../geom/Point';
import { MouseDragEvent } from './MouseDragEvent';


export class MouseDragEventSupport
{
    public static check(elmt:HTMLElement):boolean
    {
        return elmt.dataset['MouseDragEventSupport'] === 'true';
    }

    public static enable(elmt:HTMLElement):MouseDragEventSupport
    {
        elmt.dataset['MouseDragEventSupport'] = 'true';
        return new MouseDragEventSupport(elmt);
    }

    protected shouldDrag:boolean = false;
    protected isDragging:boolean = false;
    protected startPoint:Point;
    protected lastPoint:Point;
    protected cancel:() => void;
    protected listener:any;

    protected constructor(protected elmt:HTMLElement)
    {
        this.elmt.addEventListener('mousedown', this.listener = this.onTargetMouseDown.bind(this));
    }

    public destroy():void
    {
        this.elmt.removeEventListener('mousedown', this.listener);
    }

    protected onTargetMouseDown(e:MouseEvent):void
    {
        //e.preventDefault();
        //e.stopPropagation();

        this.shouldDrag = true;
        this.isDragging = false;
        this.startPoint = this.lastPoint = new Point(e.clientX, e.clientY);

        let moveHandler = this.onWindowMouseMove.bind(this);
        let upHandler = this.onWindowMouseUp.bind(this);

        this.cancel = () =>
        {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }

    protected onWindowMouseMove(e:MouseEvent):void
    {
        e.preventDefault();
        e.stopPropagation();

        let newPoint = new Point(e.clientX, e.clientY);

        if (this.shouldDrag)
        {
            if (!this.isDragging)
            {
                this.elmt.dispatchEvent(this.createEvent('dragbegin', e));
                this.isDragging = true;
            }
            else
            {
                this.elmt.dispatchEvent(this.createEvent('drag', e, newPoint.subtract(this.lastPoint)));
            }
        }

        this.lastPoint = newPoint;
    }

    protected onWindowMouseUp(e:MouseEvent):void
    {
        e.preventDefault();
        e.stopPropagation();

        if (this.isDragging)
        {
            this.elmt.dispatchEvent(this.createEvent('dragend', e));
        }

        this.shouldDrag = false;
        this.isDragging = false;
        this.lastPoint = new Point(e.clientX, e.clientY);

        if (this.cancel)
        {
            this.cancel();
        }
    }

    private createEvent(type:string, source:MouseEvent, dist?:Point):MouseDragEvent
    {
        let event = <MouseDragEvent>(new MouseEvent(type, source));
        event.startX = this.startPoint.x;
        event.startY = this.startPoint.y;

        if (dist)
        {
            event.distX = dist.x;
            event.distY = dist.y;
        }

        return event;
    }
}