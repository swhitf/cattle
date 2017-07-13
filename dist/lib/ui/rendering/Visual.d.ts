import { Point } from '../../geom/Point';
import { Rect } from '../../geom/Rect';
import { EventEmitterBase } from '../internal/EventEmitter';
export declare abstract class Visual extends EventEmitterBase {
    protected parentVisual: Visual;
    private children;
    private cachedData;
    private data;
    constructor(bounds?: Rect, children?: Visual[]);
    toString(): string;
    readonly abstract type: string;
    abstract render(gfx: CanvasRenderingContext2D): void;
    protected readonly state: Readonly<any>;
    protected cache<T>(key: string, getter: () => T): T;
    protected get<T>(stateProp: string): T;
    protected set<T>(stateProp: string, value: T): void;
    protected update(mutator: (state: any) => void): void;
    protected notify(event: string, subject: Visual, clearCache?: boolean): void;
    left: number;
    right: number;
    top: number;
    bottom: number;
    z: number;
    width: number;
    height: number;
    rotation: number;
    center: Point;
    topLeft: Point;
    size: Point;
    readonly bounds: Rect;
    protected setPosition(x: number, y: number, silent?: boolean): void;
    protected setSize(w: number, h: number, silent?: boolean): void;
    protected setRotation(rotation: number, silent?: boolean): void;
    protected setZ(z: number, silent?: boolean): void;
    readonly childCount: number;
    readonly parent: Visual;
    isMounted(): boolean;
    mount(...visuals: Visual[]): void;
    unmount(child: Visual): boolean;
    mountTo(to: Visual): void;
    unmountSelf(): void;
    toArray(): Visual[];
}