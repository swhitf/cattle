//@no-export
import { CompositionElement } from './Composition';
import { Node } from './Node';


export class Element extends Node implements CompositionElement {

    public readonly type = 'element';
    
    public draw(callback:(gfx:CanvasRenderingContext2D) => void):CompositionElement 
    {
        const { area, buffer, parent } = this;

        buffer.prepare(area.width, area.height);
        buffer.update(callback);
        
        this.dirty = true;
        this.parent.invalidate(area);

        return this;
    }
    
    public render(gfx:CanvasRenderingContext2D):void
    {
        const { area, buffer } = this;
        
        //Elements should always have an up-to-date buffer by the time render is called
        //from consumers calling the draw method.  We just need to paint the buffer
        //to the gfx with the transform provided.

        //Apply transform so we draw in the right spot on parent
        gfx.setTransform(1, 0, 0, 1, area.left, area.top);

        //Draw...
        this.buffer.drawTo(gfx);  

        this.dirty = false;
    }
}