import { Point } from '../geom/Point';
export declare class MouseDragEventSupport {
    protected elmt: HTMLElement;
    static check(elmt: HTMLElement): boolean;
    static enable(elmt: HTMLElement): MouseDragEventSupport;
    protected shouldDrag: boolean;
    protected isDragging: boolean;
    protected startPoint: Point;
    protected lastPoint: Point;
    protected cancel: () => void;
    protected listener: any;
    protected constructor(elmt: HTMLElement);
    destroy(): void;
    protected onTargetMouseDown(e: MouseEvent): void;
    protected onWindowMouseMove(e: MouseEvent): void;
    protected onWindowMouseUp(e: MouseEvent): void;
    private createEvent(type, source, dist?);
}
