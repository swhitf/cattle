import { EventEmitter } from '../base/EventEmitter';
import { Rect } from '../geom/Rect';
import { Point, PointInput } from '../geom/Point';
import { Camera } from './Camera';
export declare class InternalCamera implements Camera {
    private emitter;
    private initializing;
    readonly id: string;
    order: number;
    bounds: Rect;
    vector: Point;
    constructor(id: string, order: number, bounds: Rect, vector: Point, emitter: EventEmitter);
    readonly area: Rect;
    toCameraPoint(type: 'surface' | 'view', pt: PointInput): Point;
    toSurfacePoint(type: 'view' | 'camera', pt: PointInput): Point;
    toViewPoint(type: 'camera' | 'surface', pt: PointInput): Point;
    protected notifyChange(property: string): void;
}
