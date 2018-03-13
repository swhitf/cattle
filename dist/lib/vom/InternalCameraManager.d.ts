import { SimpleEventEmitter } from '../base/SimpleEventEmitter';
import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import { Camera } from './Camera';
import { CameraManager } from './CameraManager';
import { InternalCamera } from './InternalCamera';
export declare class InternalCameraManager extends SimpleEventEmitter implements CameraManager {
    protected array: InternalCamera[];
    readonly count: number;
    create(id: string, order?: number, bounds?: Rect, vector?: Point): Camera;
    destroy(id: string): void;
    item(idOrIndex: string | number): Camera;
    test(viewPt: Point): Camera;
    toArray(): Camera[];
    protected indexOf(id: string): number;
}
