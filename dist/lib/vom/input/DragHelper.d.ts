import { Point } from '../../geom/Point';
import { AbstractDestroyable } from '../../base/AbstractDestroyable';
export interface DragHelperCallback {
    (me: MouseEvent, distance: Point): void;
}
export declare class DragHelper extends AbstractDestroyable {
    private handler;
    private dragging;
    private previous;
    private handles;
    constructor(view: HTMLElement, handler: DragHelperCallback);
    private dragStart(me);
    private drag(me);
    private dragEnd(me);
}
