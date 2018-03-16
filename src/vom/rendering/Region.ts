import { Element } from "./Element";
import { Node } from "./Node";
import { CompositionRegion, CompositionElement } from "./Composition";

import { RectLike } from "../../geom/Rect";
import { Matrix } from "../../geom/Matrix";
import { KeyedSet } from "../../base/KeyedSet";


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

    public getElement(key:string):CompositionElement 
    {
        return this.getNode(key, key => new Element(key, this)) as Element;
    }
        
    public getRegion(key:string):CompositionRegion 
    {
        return this.getNode(key, key => new Region(key, this)) as Region;
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

    public render(gfx:CanvasRenderingContext2D):void {

        if (this.key != this.buffer.id)
        {
            throw 'WTF';
        }

        //Here we need to figure out if the buffer we have is reusable and if it is
        //we should just render the buffer to the gfx using the region info to set
        //the transform.  If we are "dirty" then we need to regenerate the buffer.  

        if (this.dirty)
        {
            //Clear and resize our buffer
            this.buffer.invalidate(this.width, this.height);

            for (let node of this.children.array) 
            {
                node.render(this.buffer.context);
            }
        }

        //Apply transform so we draw in the right spot on parent
        const mt = Matrix.identity.translate(this.left, this.top);
        gfx.setTransform(mt.a, mt.b, mt.c, mt.d, mt.e, mt.f);

        //Draw...
        this.buffer.drawTo(gfx);

        this.dirty = false;
    }

    private getNode(key:string, factory:(k:string) => Node):Node
    {
        let node = this.children.get(key);

        if (!node)
        {
            node = factory(key);
            this.children.add(node);
            this.dirty = true;
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