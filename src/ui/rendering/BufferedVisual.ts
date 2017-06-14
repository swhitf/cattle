import { Rect } from '../..';
import { Visual } from './Visual';


const BufferMode        = 'bufferMode';
const BufferInflation   = 'bufferInflation';

export enum BufferModes
{
    Buffered,
}

export abstract class CanvasVisual extends Visual
{
    constructor(private useAlpha:boolean, bounds:Rect = Rect.empty, children:Visual[] = [])
    {
        super(bounds, children);

        this.on('invalidated', () => this.bufferInvalid = true);
    }

    private buffer:HTMLCanvasElement = null;
    private bufferInvalid:boolean = true;

    protected bufferInflation:number = 10;

    public draw(gfx:CanvasRenderingContext2D):void
    {
        // let m = this.transform();
        // gfx.transform(m.a, m.b, m.c, m.d, m.e, m.f);

        let bi = this.bufferInflation;

        if (!this.buffer)
        {
            this.buffer = document.createElement('canvas');
            this.buffer.width = this.width + (bi * 2);
            this.buffer.height = this.height + (bi * 2);
            this.bufferInvalid = true;
        }

        if (this.bufferInvalid)
        {
            let bgfx = this.buffer.getContext('2d');
            bgfx.clearRect(0, 0, this.buffer.width, this.buffer.height);
            bgfx.setTransform(1, 0, 0, 1, 0, 0);
            bgfx.translate(bi, bi);
            this.performDraw(bgfx);
            this.bufferInvalid = false;
        }

        gfx.drawImage(this.buffer, -bi, -bi, this.buffer.width, this.buffer.height);
        //gfx.strokeRect(-bi, -bi, this.buffer.width, this.buffer.height);
    }

    protected abstract performDraw(gfx:CanvasRenderingContext2D):void;

    protected isParentBuffered():boolean
    {
        let parent = this.parentVisual;

        if (!!parent && parent instanceof CanvasVisual)
        {
            return !!parent.buffer || parent.isParentBuffered();
        }

        return false;
    }

    protected clearBuffer():void
    {
        this.buffer = null;
    }
}