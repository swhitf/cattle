import { Rect } from '../..';
import { Visual } from './Visual';
export declare enum BufferModes {
    Buffered = 0,
}
export declare abstract class CanvasVisual extends Visual {
    private useAlpha;
    constructor(useAlpha: boolean, bounds?: Rect, children?: Visual[]);
    private buffer;
    private bufferInvalid;
    protected bufferInflation: number;
    draw(gfx: CanvasRenderingContext2D): void;
    protected abstract performDraw(gfx: CanvasRenderingContext2D): void;
    protected isParentBuffered(): boolean;
    protected clearBuffer(): void;
}
