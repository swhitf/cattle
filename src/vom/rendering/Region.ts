import { Element } from "./Element";
import { Node } from "./Node";
import { NodeSet } from "./NodeSet";
import { CompositionRegion, CompositionElement } from "./Composition";

import { RectLike } from "../../geom/Rect";
import { Matrix } from "../../geom/Matrix";


export class Region extends Node implements CompositionRegion
{
    public readonly children = new NodeSet();
    public readonly type = 'region';

    public changed = true;

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
            this.changed = true;
        }
        if (this.top != top) 
        {
            this.top = top;
            this.changed = true;
        }
        if (this.width != width) 
        {
            this.width = width;
            this.changed = true;
        }
        if (this.height != height) 
        {
            this.height = height;
            this.changed = true;
        }
    }

    public getElement(key:string):CompositionElement 
    {
        return this.getNode(key, key => new Element(key)) as Element;
    }
        
    public getRegion(key:string):CompositionRegion 
    {
        return this.getNode(key, key => new Region(key)) as Region;
    }

    private getNode(key:string, factory:(k:string) => Node):Node
    {
        let node = this.children.get(key);
        if (node)
        {
            node.cycle++;
        }
        else
        {
            node = factory(key);
            node.cycle = this.cycle;
            this.children.add(node);
            this.changed = true;
        }

        return node;
    }

    public render(cycle:number, gfx:CanvasRenderingContext2D):void {
        const { buffer, children } = this;

        //Here we need to figure out if the buffer we have is reusable and if it is
        //we should just render the buffer to the gfx using the region info to set
        //the transform.

        //If we are "dirty" then we need to regenerate the buffer.  We are "dirty" if
        //our changed flag is set, or a child is dirty, or a child has not been "touched"
        //during this cycle.

        if (this.checkDirty(cycle))
        {
            //Prune any invalid children before we draw
            children.prune(cycle);

            //Clear and resize our buffer
            buffer.invalidate(this.width, this.height);

            for (let node of this.children.array) 
            {
                node.render(cycle, buffer.context);
            }
        }

        //Apply transform so we draw in the right spot on parent
        const mt = Matrix.identity.translate(this.left, this.top);
        gfx.setTransform(mt.a, mt.b, mt.c, mt.d, mt.e, mt.f);

        //Draw...
        this.buffer.drawTo(gfx);

        this.changed = false;
    }

    private checkDirty(cycle:number):boolean 
    {
        if (this.changed)
            return true;

        for (let node of this.children.array) 
        {
            if (node.changed)
                return true;

            if (node.cycle != cycle)
                return true;
        }

        return false;
    }
}