import { Matrix } from '../../geom/Matrix';
import { RectLike } from '../../geom/Rect';
export interface CompositionElement {
    debug: string;
    readonly dirty: boolean;
    dim(width: number, height: number): CompositionElement;
    draw(callback: (gfx: CanvasRenderingContext2D) => void): any;
    transform(mt: Matrix): CompositionElement;
}
export interface CompositionRegion {
    arrange(left: number, top: number, width: number, height: number): any;
    arrange(leftOrRect: number | RectLike, top?: number, width?: number, height?: number): any;
    getElement(id: string, z: number): CompositionElement;
    getRegion(id: string, z: number): CompositionRegion;
}
export declare class Composition {
    private rootRegion;
    readonly root: CompositionRegion;
    beginUpdate(): void;
    endUpdate(): void;
    invalidate(): void;
    render(to: HTMLCanvasElement): void;
}
