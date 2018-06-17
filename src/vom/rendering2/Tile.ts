import { KeyedSet } from '../../base/KeyedSet';
import { Matrix } from '../../geom/Matrix';
import { Rect } from '../../geom/Rect';
import { Font } from '../styling/Font';
import { Buffer } from './Buffer';
import { CompositionTile } from './Composition2';
import { Element } from './Element';
import { TileRef } from './TileRef';


export class Tile implements CompositionTile
{
    public readonly id:string;
    public readonly area:Rect;
    
    public retain:boolean = true;
    public invalid:boolean = true;
    public dirtyRegions:Rect[] = [];
    public buffer:Buffer = new Buffer();
    public count = 0;

    constructor(ref:TileRef)
    {
        this.id = ref.s;
        this.area = new Rect(ref.x * TileRef.DW, ref.y * TileRef.DH, TileRef.DW, TileRef.DH);
    }

    public invalidate(region:Rect):void
    {
        if (!this.area.intersects(region)) return;
        this.invalid = true;
        this.dirtyRegions.push(region);
    }

    public draw(elements:KeyedSet<Element>):void
    {
        let { buffer, dirtyRegions, area } = this;
        
        //Check to see if we need to do a full draw
        const canQuickDraw = buffer.width == area.width && buffer.height == area.height;

        if (canQuickDraw)
        {
            //First, consolidate any overlapping dirty areas
            dirtyRegions = consolidate(dirtyRegions);

            //Clear the dirty areas of the buffer
            dirtyRegions.forEach(x => buffer.clear(x));

            //Render any elements that appear in these areas
            elements.forEach(elmt =>
            {
                for (let dr of dirtyRegions)
                {
                    if (dr.intersects(elmt.area))
                    {
                        const t = Matrix.identity.translate(elmt.area.left - area.left, elmt.area.top - area.top);
                        buffer.context.setTransform(t.a, t.b, t.c, t.d, t.e, t.f);
                        elmt.buffer.drawTo(buffer.context);
                    }
                }
            });
            
            buffer.context.setTransform(1, 0, 0, 1, 0, 0);
            // buffer.context.strokeStyle = 'blue';
            // buffer.context.fillStyle = 'blue';
            // dirtyRegions.forEach(x => {
            //     buffer.context.strokeRect(x.left - area.left, x.top - area.top, x.width, x.height);

            // });
            
            buffer.context.strokeStyle = 'red';
            buffer.context.fillStyle = 'red';
            buffer.context.strokeRect(0, 0, TileRef.DW, TileRef.DH);
            buffer.context.font = (new Font('Arial', 20)).toString()
            buffer.context.fillText(this.id + ' / ' + (this.count++), 25, 25);
        }
        else
        {
            //Prepare (size & clear) our buffer 
            buffer.prepare(area.width, area.height)

            buffer.context.fillStyle = 'white';
            buffer.context.fillRect(0, 0, TileRef.DW, TileRef.DH);
            buffer.context.setTransform(1, 0, 0, 1, 0, 0);

            //Render each child
            elements.forEach(e => 
            {
                if (e.area.intersects(area))
                {
                    const t = Matrix.identity.translate(e.area.left - area.left, e.area.top - area.top);
                    buffer.context.setTransform(t.a, t.b, t.c, t.d, t.e, t.f);
                    e.buffer.drawTo(buffer.context);
                }
            });
            
            buffer.context.setTransform(1, 0, 0, 1, 0, 0);
            buffer.context.strokeStyle = 'red';
            buffer.context.fillStyle = 'red';
            buffer.context.strokeRect(0, 0, TileRef.DW, TileRef.DH);
            buffer.context.font = (new Font('Arial', 20)).toString()
            buffer.context.fillText(this.id + ' / ' + (this.count++), 25, 25);
        }

        this.invalid = false;
        this.dirtyRegions = [];
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