//@no-export
import { Rect } from '../../geom/Rect';
import { CompositionElement, CompositionRegion } from './Composition';
import { Element } from './Element';
import { Key } from './Key';
import { Node } from './Node';
import { Report } from './Report';


export class Region extends Node implements CompositionRegion
{
    public readonly type = 'region';

    private dirtyAreas:Rect[] = [];

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
        const nodes = this.children.removeWhere(x => !x.accessed);
        //For each pruned node, mark it's area as invalid
        nodes.forEach(x => this.invalidate(x.area));
        
        this.children.forEach(x => x.endUpdate());
    }

    public invalidate(area:Rect):void
    {
        if (area.equals(this.dirtyAreas[this.dirtyAreas.length -1]) ||
            area.equals(this.dirtyAreas[this.dirtyAreas.length -2]))
            return;

        this.dirtyAreas.push(area);
        this.dirty = true;

        if (this.parent)
        {
            this.parent.invalidate(this.area);
        }
    }

    public render(gfx:CanvasRenderingContext2D):void 
    {   
        const { area, buffer } = this;
        
        //Here we need to figure out if the buffer we have is reusable and if it is
        //we should just render the buffer to the gfx using the region info to set
        //the transform.  If we are "dirty" then we need to update our buffer with
        //all required changes.

        if (this.dirty)
        {
            this.updateBuffer();
        }

        //Apply transform so we draw in the right spot on parent
        gfx.setTransform(1, 0, 0, 1, area.left, area.top);
        
        //Draw...
        Report.time('Region.Draw', () => this.buffer.drawTo(gfx));

        this.dirty = false;
    }

    private getNode(key:Key, factory:(k:Key) => Node):Node
    {
        let node = this.children.get(key);

        if (!node)
        {
            this.children.add(node = factory(key));
            this.dirty = true;
            node.dirty = true;
        }
        else
        {
            node.age++;
        }

        node.accessed = true;        
        return node;
    }

    private updateBuffer():void
    {
        let { area, buffer, children, dirtyAreas } = this;

        //Updating the buffer involves drawing child elements to the buffer in the least
        //steps possible.  Sometimes, our buffer may need to be reshaped due to a change
        //in the region bounds.  If this is the case we must "prepare" the buffer which
        //will cause it to be wiped.  In this scenario, we do a full redraw of all children.
        //Normally, the buffer size will match the bounds, in which case we can do a quick
        //draw.  When children are arranged they "invalidate" their parent region with a
        //specified rectangle.  We use this list of "dirtyAreas" to know what we need to
        //redraw first.  Once these are satisified, we draw any dirty children to complete
        //the update.

        //Check to see if we need to do a full draw
        const canQuickDraw = buffer.width == area.width && buffer.height == area.height;

        if (canQuickDraw)
        {
            //First, consolidate any overlapping dirty areas
            dirtyAreas = consolidate(dirtyAreas);

            //Clear the dirty areas of the buffer
            dirtyAreas.forEach(x => buffer.clear(x));

            //Render any children that appear in these areas
            children.forEach(node =>
            {
                //If child is dirty, we need to render anyway...
                if (node.dirty)
                {
                    node.render(buffer.context);
                }
                //Otherwise, if the child intersects a dirty area, render with a clip of the area
                else
                {
                    for (let da of dirtyAreas)
                    {
                        if (da.intersects(node.area))
                        {
                            node.render(buffer.context, da);
                            break;
                        }
                    }
                }
            });

            // Uncomment to see the dirty areas
            // for (let da of dirtyAreas) 
            // {
            //     buffer.context.setTransform(1, 0, 0, 1, 0, 0);
            //     buffer.context.strokeStyle = 'red';
            //     buffer.context.strokeRect(da.left, da.top, da.width, da.height);
            // }
        }
        else
        {
            //Prepare (size & clear) our buffer 
            buffer.prepare(area.width, area.height)

            //Render each child, even if not dirty
            children.forEach(node => node.render(buffer.context));
        }

        this.dirty = false;
        this.dirtyAreas.splice(0, this.dirtyAreas.length);
    }
}

function consolidate(rects:Rect[]):Rect[]
{   
    if (rects.length < 2)
    {
        return rects;
    }

    let wasChangeMade = true;

    while (wasChangeMade)
    {
        wasChangeMade = false;

        for (let a = 0; a < rects.length; a++)
        {
            if (!rects[a]) continue;

            for (let b = 0; b < rects.length; b++)
            {
                if (!rects[b] || a == b) continue;
                
                if (rects[a].intersects(rects[b]))
                {
                    rects[a] = Rect.fromMany([rects[a], rects[b]]);
                    rects[b] = null;
                    wasChangeMade = true;

                    break;
                }
            }

            if (wasChangeMade) 
            {
                break;
            }
        }
    }

    return rects.filter(x => !!x);
}