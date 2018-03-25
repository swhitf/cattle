//@no-export
import { Rect } from '../../geom/Rect';
import { Key } from './Key';
import { Region } from './Region';


export interface CompositionFragment
{
    readonly id:string;

    readonly age:number;

    readonly area:Rect;

    readonly dirty:boolean;

    arrange(area:Rect);
}

export interface CompositionElement extends CompositionFragment
{
    draw(callback:(gfx:CanvasRenderingContext2D) => void);
}

export interface CompositionRegion extends CompositionFragment
{
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