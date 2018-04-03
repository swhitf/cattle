import { SimpleEventEmitter } from '../base/SimpleEventEmitter';
import { Matrix } from '../geom/Matrix';
import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import { VisualEvent } from './events/VisualEvent';
import { AnimationBuilder } from './styling/Animate';
import { Surface } from './Surface';
export interface VisualIteratorCallback<R = void> {
    (x: Visual, i: number): R;
}
export interface VisualCallback<R = void> {
    (x: Visual): R;
}
export interface VisualTagSet {
    readonly length: number;
    item(index: number): string;
    has(trait: string): boolean;
    add(trait: string): VisualTagSet;
    remove(trait: string): VisualTagSet;
    toggle(trait: string): VisualTagSet;
    set(trait: string, value: boolean): VisualTagSet;
    toArray(): string[];
}
export declare abstract class Visual extends SimpleEventEmitter implements Visual {
    readonly id: string;
    readonly classes: VisualTagSet;
    readonly traits: VisualTagSet;
    protected readonly children: Visual[];
    protected parentVisual: Visual;
    private cacheData;
    private storeData;
    private __dirty;
    private __state;
    private __style;
    constructor(bounds?: Rect);
    readonly abstract canHost: boolean;
    readonly abstract type: string;
    abstract render(gfx: CanvasRenderingContext2D): void;
    topLeft: Point;
    size: Point;
    zIndex: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
    center: Point;
    readonly bounds: Rect;
    readonly absoluteBounds: Rect;
    readonly transform: Matrix;
    readonly transformLocal: Matrix;
    readonly childCount: number;
    readonly parent: Visual;
    readonly root: Visual;
    readonly surface: Surface;
    animate(): AnimationBuilder<this>;
    data(key: string, value?: any): any;
    isMounted(): boolean;
    mount(child: Visual): void;
    unmount(child: Visual): boolean;
    mountTo(to: Visual): void;
    unmountSelf(): void;
    toArray(recursive?: boolean): Visual[];
    map<T>(callback: VisualIteratorCallback<T>): void;
    filter(callback: VisualIteratorCallback<boolean>): Visual[];
    visit(callback: VisualCallback): void;
    toString(): string;
    protected cache<T>(key: string, getter: () => T): T;
    protected clearCache(): void;
    protected visualWillMount(): void;
    protected visualDidMount(): void;
    protected visualWillUnmount(): void;
    protected visualStyleDidChange(): void;
    protected notify(evt: VisualEvent, bubble?: boolean): void;
    protected notifyChange(property: string): void;
    protected notifyCompose(child: Visual, mode: 'mount' | 'unmount'): void;
}
