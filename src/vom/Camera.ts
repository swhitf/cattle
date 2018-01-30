import { Visual } from './Visual';
import { Point, PointInput } from '../geom/Point';
import { Matrix } from '../geom/Matrix';
import { Rect } from '../geom/Rect';



export interface Camera
{
    readonly id:string;
    
    order:number; 

    bounds:Rect; 
    
    vector:Point;

    readonly area:Rect;

    toCameraPoint(type:'surface'|'view', pt:PointInput):Point;

    toSurfacePoint(type:'view'|'camera', pt:PointInput):Point;

    toViewPoint(type:'camera'|'surface', pt:PointInput):Point;
}