//@no-export
import { Matrix } from '../../geom/Matrix';
import { RectLike } from '../../geom/Rect';
import { Key } from './Key';
import { Region } from './Region';


export interface CompositionElement 
{
    readonly id:string;

    readonly age:number;
    
    readonly dirty:boolean;

    dim(width:number, height:number):CompositionElement;

    draw(callback:(gfx:CanvasRenderingContext2D) => void);

    transform(mt:Matrix):CompositionElement;
}

export interface CompositionRegion 
{
    readonly id:string;
    
    readonly age:number;
    
    arrange(left:number, top:number, width:number, height:number);
    arrange(leftOrRect:number|RectLike, top?:number, width?:number, height?:number);

    getElement(id:string, z:number):CompositionElement;

    getRegion(id:string, z:number):CompositionRegion;
}

export class Composition 
{
    private rootRegion = new Region(new Key('root'));

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

    public invalidate():void
    {
        this.rootRegion = new Region(new Key('root'));
    }

    public render(to:HTMLCanvasElement):void 
    {
        const gfx = to.getContext('2d');
        gfx.clearRect(0, 0, to.width, to.height);

        this.rootRegion.render(gfx);
    }
}