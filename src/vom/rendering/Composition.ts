import { Buffer } from "./Buffer";
import { KeyedSet } from "../../base/KeyedSet";
import { RectLike } from "../../geom/Rect";
import { Matrix } from "../../geom/Matrix";
import { Region } from "./Region";


export interface CompositionElement 
{
    readonly dirty:boolean;

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

    public beginUpdate():void
    {
        this.rootRegion.beginUpdate();
    }

    public endUpdate():void
    {
        this.rootRegion.endUpdate();
    }

    public render(to:HTMLCanvasElement):void 
    {
        const gfx = to.getContext('2d');
        gfx.clearRect(0, 0, to.width, to.height);

        this.rootRegion.render(gfx);
    }
}