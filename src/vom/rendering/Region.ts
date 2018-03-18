//@no-export
import { Matrix } from '../../geom/Matrix';
import { RectLike } from '../../geom/Rect';
import { CompositionElement, CompositionRegion } from './Composition';
import { Element } from './Element';
import { Key } from './Key';
import { Node } from './Node';


export class Region extends Node implements CompositionRegion
{
    public readonly type = 'region';

    public left:number;
    public top:number;
    public width:number;
    public height:number;

    public arrange(rect:RectLike);
    public arrange(left:number, top:number, width:number, height:number);
    public arrange(leftOrRect:number|RectLike, top?:number, width?:number, height?:number) 
    {
        if ((typeof leftOrRect) === 'object') 
        {
            const r = leftOrRect as RectLike;
            return this.arrange(r.left, r.top, r.width, r.height);
        }

        if (this.left != leftOrRect) 
        {
            this.left = leftOrRect as number;
            this.dirty = true;
        }
        if (this.top != top) 
        {
            this.top = top;
            this.dirty = true;
        }
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
    }

    public getElement(id:string, z:number):CompositionElement 
    {
        return this.getNode(new Key(id, z), key => new Element(key, this)) as Element;
    }
        
    public getRegion(id:string, z:number):CompositionRegion 
    {
        return this.getNode(new Key(id, z), key => new Region(key, this)) as Region;
    }

    public endUpdate():void
    {
        //When an update has finished, we must prune any nodes that were not "accessed" 
        //during the update.
        const count = this.children.removeWhere(x => !x.accessed);

        if (count > 0)
        {
            this.dirty = true;
        }

        this.children.forEach(x => x.endUpdate());
    }

    public invalidate():void
    {
    }

    public render(gfx:CanvasRenderingContext2D):void {

        //Here we need to figure out if the buffer we have is reusable and if it is
        //we should just render the buffer to the gfx using the region info to set
        //the transform.  If we are "dirty" then we need to regenerate the buffer.  

        if (this.dirty)
        {
            //Clear and resize our buffer
            this.buffer.invalidate(this.width, this.height);

            this.children.forEach(node =>
            {
                node.render(this.buffer.context);
            });
        }

        //Apply transform so we draw in the right spot on parent
        const mt = Matrix.identity.translate(this.left, this.top);
        gfx.setTransform(mt.a, mt.b, mt.c, mt.d, mt.e, mt.f);

        //Draw...
        this.buffer.drawTo(gfx);

        this.dirty = false;
    }

    private getNode(key:Key, factory:(k:Key) => Node):Node
    {
        let node = this.children.get(key);

        if (!node)
        {
            this.children.add(node = factory(key));
            node.dirty = true;
        }

        node.accessed = true;
        return node;
    }

    // private checkDirty(cycle:number):boolean 
    // {
    //     if (this.changed)
    //         return true;

    //     for (let node of this.children.array) 
    //     {
    //         if (node.changed)
    //             return true;

    //         if (node.cycle != cycle)
    //             return true;
    //     }

    //     return false;
    // }
}