import { Visual } from './Visual';
import { Point, PointInput } from '../geom/Point';
import { Matrix } from '../geom/Matrix';
import { Rect } from '../geom/Rect';


export interface Camera
{
    readonly id:string;

    readonly order:number;
    
    readonly offsetLeft:number;

    readonly offsetTop:number;
    
    readonly left:number;

    readonly top:number;
    
    readonly width:number;

    readonly height:number;
    
    readonly transform:Matrix;

    toSurfacePoint(viewPt:PointInput):Point;

    toViewPoint(surfacePt:PointInput):Point;
}