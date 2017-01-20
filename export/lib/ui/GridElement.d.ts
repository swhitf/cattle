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
    scrollLeft: number;
    scrollTop: number;
    readonly root: HTMLCanvasElement;
    readonly kernel: GridKernel;
    private layout;
    private dirty;
    private buffers;
    private visuals;
    private constructor(canvas);
    readonly width: number;
    readonly height: number;
    readonly modelWidth: number;
    readonly modelHeight: number;
    readonly virtualWidth: number;
    readonly virtualHeight: number;
    readonly scroll: Point;
    extend(ext: GridExtension): GridElement;
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
    invalidate(): void;
    redraw(): void;
    private draw();
    private computeViewport();
    private updateVisuals();
    private drawVisuals();
    private createBuffer(width, height);
    private createVisual(cell, region);
    private forwardMouseEvent(event);
    private forwardKeyEvent(event);
}
