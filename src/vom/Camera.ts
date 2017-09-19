import { Visual } from './Visual';
import { Point, PointInput } from '../geom/Point';
import { Matrix } from '../geom/Matrix';
import { Rect } from '../geom/Rect';



export interface Camera
{
    readonly id:string, 
    
    readonly transform:Matrix;
    
    order:number, 

    bounds:Rect, 
    
    vector:Point

    toSurfacePoint(viewPt:PointInput):Point;

    toViewPoint(surfacePt:PointInput):Point;
}