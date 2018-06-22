import { Point, PointInput } from '../geom/Point';
import { Rect } from '../geom/Rect';


export interface Camera
{
    readonly id:string;
    
    order:number; 

    /**
     * Describes the bounds of the camera within the viewport.
     */
    bounds:Rect; 
    
    /**
     * Describes the position the camera is looking at.
     */
    vector:Point;

    /**
     * Describes the viewable area of the camera.
     */
    readonly area:Rect;

    toCameraPoint(type:'surface'|'view', pt:PointInput):Point;

    toSurfacePoint(type:'view'|'camera', pt:PointInput):Point;

    toViewPoint(type:'camera'|'surface', pt:PointInput):Point;
}