import { Buffer } from "./Buffer";
import { KeyedSet } from "../../base/KeyedSet";
import { RectLike } from "../../geom/Rect";
import { Matrix } from "../../geom/Matrix";
import { Region } from "./Region";


export interface CompositionElement 
{
    readonly changed:boolean;

    dim(width:number, height:number):CompositionElement;

    draw(callback:(gfx:CanvasRenderingContext2D) => void);

    transform(mt:Matrix):CompositionElement;
}

export interface CompositionRegion 
{
    arrange(left:number, top:number, width:number, height:number);
    arrange(leftOrRect:number|RectLike, top?:number, width?:number, height?:number);

    getElement(key:string):CompositionElement;

    getRegion(key:string):CompositionRegion;
}

export class Composition 
{
    private rootRegion = new Region('root');

    public get root():CompositionRegion
    {
        return this.rootRegion;
    }

    public beginUpdate()
    {
        this.rootRegion.cycle++;
        return this.rootRegion;
    }

    public endUpdate():void
    {
        //YOLO
    }

    public render(gfx:CanvasRenderingContext2D):void 
    {
        this.rootRegion.render(this.rootRegion.cycle, gfx);
    }
}