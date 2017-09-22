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
    private initializing = true;

    public readonly id:string;
    
    @Observable()
    public order:number; 
    
    @Observable()
    public bounds:Rect;
    
    @Observable()
    public vector:Point;

    constructor(id:string, order:number, bounds:Rect, vector:Point, private emitter:EventEmitter)
    {
        this.id = id;
        this.order = order;
        this.bounds = bounds;
        this.vector = vector;
        
        this.initializing = false;
    }
    
    public toCameraPoint(type:'surface'|'view', pt:PointInput):Point
    {
        let x = Point.create(pt);
        
        if (type === 'surface')
        {
            return x.add(this.vector);
        }
        else
        {
            return x.subtract([this.bounds.left, this.bounds.top]);
        }
    }
    
    public toSurfacePoint(type:'view'|'camera', pt:PointInput):Point
    {
        let x = type === 'view'
            ? this.toCameraPoint(type, pt)
            : Point.create(pt);

        return x.subtract(this.vector);
    }
    
    public toViewPoint(type:'camera'|'surface', pt:PointInput):Point
    {
        let x = type === 'surface'
            ? this.toCameraPoint(type, pt)
            : Point.create(pt);

        return x.add([this.bounds.left, this.bounds.top])
    }

    protected notifyChange(property:string):void
    {
        if (!this.initializing)
        {
            this.emitter.emit(new CameraChangeEvent(this, property));
        }
    }
}