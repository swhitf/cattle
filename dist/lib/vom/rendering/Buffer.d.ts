import { RectLike } from '../../geom/Rect';
export interface BufferUpdateCallback {
    (gfx: CanvasRenderingContext2D): void;
}
export declare class Buffer {
    readonly id: string;
    private canvas;
    constructor(id: string);
    readonly valid: boolean;
    readonly context: CanvasRenderingContext2D;
    width: number;
    height: number;
    clear(area: RectLike): void;
    drawTo(gfx: CanvasRenderingContext2D): void;
    prepare(width: number, height: number): void;
    update(callback: BufferUpdateCallback): void;
}
