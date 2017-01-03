import { CellModel } from '../model/CellModel';
import { Rect } from '../geom/Rect';


export interface ClassDef<T>
{
    //new(...args:T[]);
}

export interface Renderer<T>
{
    (gfx:CanvasRenderingContext2D, region:Rect, cell:T):void;
}

export function renderer<T>(func:Renderer<T>)
{
    return function(ctor:ClassDef<T>):void
    {
        //noinspection TypeScriptUnresolvedFunction
        Reflect.defineMetadata('custom:renderer', func, ctor);
    }
}