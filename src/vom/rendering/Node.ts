//@no-export
import { Rect, RectLike } from '../../geom/Rect';
import { Buffer } from './Buffer';
import { Key } from './Key';
import { NodeList } from './NodeList';
import { Region } from './Region';


export abstract class Node
{
    public readonly key:Key;
    public readonly parent:Region;
    public readonly children = new NodeList();
    
    protected readonly buffer:Buffer;

    public age:number = 0;
    public area:Rect;
    public accessed:boolean;
    public dirty:boolean;
    
    constructor(key:Key, parent?:Region) 
    {
        this.key = key;
        this.buffer = new Buffer(key.id);
        this.parent = parent;
    }

    public get id():string
    {
        return this.key.id;
    }

    public arrange(rect:Rect)
    {
        if (!!this.area && this.area.equals(rect)) return;

        if (this.parent && this.area)
        {
            this.parent.invalidate(this.area);
        }

        if (!this.area || (this.area.width != rect.width || this.area.height != rect.height))
        {
            this.dirty = true;
        }

        this.area = rect;

        if (this.parent && this.area)
        {
            this.parent.invalidate(this.area);
        }
    }

    public beginUpdate():void
    {
        this.accessed = false;
        this.dirty = false;

        this.children.forEach(x => x.beginUpdate());
    }

    public endUpdate():void
    {
        this.children.forEach(x => x.beginUpdate());
    }

    public abstract get type():string;

    public abstract render(gfx:CanvasRenderingContext2D, clip?:RectLike):void;
}