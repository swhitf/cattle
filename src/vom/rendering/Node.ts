import { Buffer } from "./Buffer";
import { KeyedSet } from "../../base/KeyedSet";


export abstract class Node
{
    public readonly key:string;
    public readonly parent:Node;
    public readonly children = new KeyedSet<Node>(x => x.key);

    public buffer:Buffer;
    public accessed:boolean;

    private dirtyVal:boolean;

    constructor(key:string, parent?:Node) {
        this.key = key;
        this.buffer = new Buffer(key);
        this.parent = parent;
    }

    public get dirty():boolean
    {
        return this.dirtyVal;
    }

    public set dirty(value:boolean)
    {
        if (!!value && this.parent && !this.parent.dirty)
        {
            this.parent.dirty = value;
        }

        this.dirtyVal = value;
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

    public abstract render(gfx:CanvasRenderingContext2D):void;
}