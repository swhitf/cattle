import { Buffer } from "./Buffer";


export abstract class Node
{
    public readonly key:string;
    public readonly parent:Node;

    public buffer:Buffer;
    public cycle:number = 0;

    private changedVal:boolean = true;

    constructor(key:string, parent?:Node) {
        this.key = key;
        this.buffer = new Buffer(key);
        this.parent = parent;
    }

    public get changed():boolean
    {
        return this.changedVal;
    }

    public set changed(value:boolean)
    {
        if (!!value && this.parent && !this.parent.changedVal)
        {
            this.parent.changed = value;
        }

        this.changedVal = value;
    }

    public abstract get type():string;

    public abstract render(cycle:number, gfx:CanvasRenderingContext2D):void;
}