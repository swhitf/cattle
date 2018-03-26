import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { Point } from '../../geom/Point';
export interface DragHelperCallback {
    (me: MouseEvent, distance: Point): void;
}
export declare class DragHelper extends AbstractDestroyable {
    private handler;
    private dragging;
    private previous;
    private handles;
    constructor(view: HTMLElement, handler: DragHelperCallback);
    destroy(): void;
    private dragStart(me);
    private drag(me);
    private dragEnd(me);
}
