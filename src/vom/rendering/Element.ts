import { Node } from "./Node";
import { CompositionElement } from "./Composition";
import { Matrix } from "../../geom/Matrix";


export class Element extends Node implements CompositionElement {

    public readonly type = 'element';
    public debug:string;

    public width:number;
    public height:number;
    public mt:Matrix;

    public dim(width:number, height:number):CompositionElement 
    {
        if (this.width != width) 
        {
            this.width = width;
            this.dirty = true;
        }
        if (this.height != height) 
        {
            this.height = height;
            this.dirty = true;
        }

        return this;
    }
    
    public draw(callback:(gfx:CanvasRenderingContext2D) => void):CompositionElement 
    {
        const { buffer } = this;

        buffer.invalidate(this.width, this.height);
        buffer.update(callback);
        this.dirty = true;

        return this;
    }
    
    public transform(mt:Matrix):CompositionElement 
    {
        if (!this.mt || !this.mt.equals(mt))
        {
            this.mt = mt;
            this.dirty = true;
        }

        return this;
    }

    public render(gfx:CanvasRenderingContext2D):void
    {
        const { buffer, mt } = this;
        
        //Elements should always have an up-to-date buffer by the time render is called
        //from consumers calling the draw method.  We just need to paint the buffer
        //to the gfx with the transform provided.

        //Apply transform so we draw in the right spot on parent
        gfx.setTransform(mt.a, mt.b, mt.c, mt.d, mt.e, mt.f);

        //Draw...
        this.buffer.drawTo(gfx);  

        this.dirty = false;
    }
}