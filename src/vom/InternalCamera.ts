import { CameraChangeEvent } from './events/CameraChangeEvent';
import { CameraEvent } from './events/CameraEvent';
import { EventEmitter } from '../base/EventEmitter';
import { Observable } from '../base/Observable';
import { Rect } from '../geom/Rect';
import { Point, PointInput } from '../geom/Point';
import { Visual, VisualPredicate } from './Visual';
import { Matrix } from '../geom/Matrix';
import { Camera } from './Camera';


export class InternalCamera implements Camera
{
    public readonly id:string;
    
    @Observable()
    public order:number; 
    
    @Observable()
    public bounds:Rect;
    
    @Observable()
    public vector:Point;

    public transform:Matrix;

    constructor(id:string, order:number, bounds:Rect, vector:Point, private emitter:EventEmitter)
    {
        this.id = id;
        this.order = order;
        this.bounds = bounds;
        this.vector = vector;

        this.transform = Matrix.identity.translate(vector.x, vector.y).inverse()
    }

    public toSurfacePoint(viewPt:PointInput):Point
    {
        return this.transform
            .inverse()
            .apply(Point.create(viewPt));
    }

    public toViewPoint(surfacePt:PointInput):Point
    {
        return this.transform.apply(Point.create(surfacePt));
    }

    protected notifyChange(property:string):void
    {
        this.emitter.emit(new CameraChangeEvent(this, property));
    }
}