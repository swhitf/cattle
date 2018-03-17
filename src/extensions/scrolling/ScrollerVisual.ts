import { Rect } from '../../geom/Rect';
import { Visual } from '../../vom/Visual';


export class ScrollerVisual extends Visual {
    
    public readonly canHost:boolean = false;
    public readonly type:string = 'scroller';

    constructor(bounds:Rect = Rect.empty)
    {
        super(bounds);

        this.zIndex = 1000000;
    }

    public render(gfx:CanvasRenderingContext2D):void 
    {
        gfx.fillStyle = 'red';
        gfx.fillRect(0, 0, this.width, this.height);
    }
}