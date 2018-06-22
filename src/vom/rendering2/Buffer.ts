//@no-export
import { Rect, RectLike } from '../../geom/Rect';


export interface BufferUpdateCallback 
{
    (gfx:CanvasRenderingContext2D):void;
}

export class Buffer 
{
    private canvas:HTMLCanvasElement;

    constructor() 
    {
        this.canvas = document.createElement('canvas');
    }

    public get context():CanvasRenderingContext2D 
    {
        return this.canvas.getContext('2d', { alpha: false });
    }

    public get width():number 
    {
        return this.canvas.width;
    }

    public set width(val:number) 
    {
        this.canvas.width = val;
    }

    public get height():number 
    {
        return this.canvas.height;
    }

    public set height(val:number) 
    {
        this.canvas.height = val;
    }

    public clear(area:RectLike):void 
    {
        const gfx = this.context;
        gfx.setTransform(1, 0, 0, 1, 0, 0);
        // gfx.fillStyle = 'red';
        // gfx.fillRect(area.left, area.top, area.width, area.height);
        gfx.clearRect(area.left, area.top, area.width, area.height);
    }

    public drawTo(gfx:CanvasRenderingContext2D, clipRect?:Rect):void 
    {
        gfx.drawImage(this.canvas, 0, 0);
    }

    public prepare(width:number, height:number):void 
    {
        this.canvas.width = width;
        this.canvas.height = height;
        const gfx = this.context;
        gfx.setTransform(1, 0, 0, 1, 0, 0);
        gfx.clearRect(0, 0, width, height);
    }

    public update(callback:BufferUpdateCallback):void 
    {
        callback(this.context);
    }
}