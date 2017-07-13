import { Padding } from '../geom/Padding';
import { EventEmitterBase } from './internal/EventEmitter';
import { GridKernel } from './GridKernel';
import { GridCell } from '../model/GridCell';
import { GridModel } from '../model/GridModel';
import { MouseDragEvent } from '../input/MouseDragEvent';
import { Rect, RectLike } from '../geom/Rect';
import { Point, PointLike } from '../geom/Point';
export interface GridExtension {
    init?(grid: GridElement, kernel: GridKernel): void;
}
export interface GridExtender {
    (grid: GridElement, kernel: GridKernel): void;
}
export interface GridMouseEvent extends MouseEvent {
    readonly cell: GridCell;
    readonly gridX: number;
    readonly gridY: number;
}
export interface GridMouseDragEvent extends MouseDragEvent {
    readonly cell: GridCell;
    readonly gridX: number;
    readonly gridY: number;
}
export interface GridKeyboardEvent extends KeyboardEvent {
}
export declare class GridElement extends EventEmitterBase {
    private canvas;
    static create(target: HTMLElement, initialModel?: GridModel): GridElement;
    model: GridModel;
    freezeMargin: Point;
    padding: Padding;
    scroll: Point;
    readonly root: HTMLCanvasElement;
    readonly container: HTMLElement;
    readonly kernel: GridKernel;
    private hotCell;
    private dirty;
    private layout;
    private buffers;
    private visuals;
    private frame;
    private constructor(canvas);
    readonly width: number;
    readonly height: number;
    readonly modelWidth: number;
    readonly modelHeight: number;
    readonly virtualWidth: number;
    readonly virtualHeight: number;
    readonly scrollLeft: number;
    readonly scrollTop: number;
    extend(ext: GridExtension | GridExtender): GridElement;
    exec(command: string, ...args: any[]): void;
    get(variable: string): any;
    set(variable: string, value: any): void;
    mergeInterface(): GridElement;
    focus(): void;
    getCellAtGridPoint(pt: PointLike): GridCell;
    getCellAtViewPoint(pt: PointLike): GridCell;
    getCellsInGridRect(rect: RectLike): GridCell[];
    getCellsInViewRect(rect: RectLike): GridCell[];
    getCellGridRect(ref: string): Rect;
    getCellViewRect(ref: string): Rect;
    scrollTo(ptOrRect: PointLike | RectLike): void;
    bash(): void;
    invalidate(query?: string): void;
    redraw(forceImmediate?: boolean): void;
    private draw(forced);
    private computeViewFragments();
    private computeViewport();
    private updateVisuals();
    private drawVisuals();
    private createBuffer(width, height);
    private createVisual(cell, region);
    private forwardMouseEvent(event);
    private forwardKeyEvent(event);
    private enableEnterExitEvents();
    private createGridMouseEvent(type, source);
}
