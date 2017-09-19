import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import { Camera } from './Camera';


export interface CameraSet
{
    readonly count:number;
    
    add(id:string, order:number, offset:Point, view:Rect):Camera;

    remove(tm:Camera):void;

    item(index:number):Camera;
}