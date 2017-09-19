import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import { Camera } from './Camera';


/**
 * Defines the interface of an object that manages the cameras for a surface.  A surface must
 * always have a `main` camera, but can have further user defined cameras.
 */
export interface CameraManager
{
    /**
     * The number of cameras that exist.
     */
    readonly count:number;
    
    /**
     * Creates a new camera with the specified id and settings.
     */
    create(id:string, order:number, bounds:Rect, vector:Point):Camera;

    /**
     * Destroys the camera with the specified id.  Cannot destroy `main`.
     */
    destroy(id:string):void;

    /**
     * Retrieves, if existing, the camera at the specified index or with the specified id.
     */
    item(idOrIndex:string|number):Camera;
}