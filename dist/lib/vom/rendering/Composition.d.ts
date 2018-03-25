import { Rect } from '../../geom/Rect';
export interface CompositionFragment {
    readonly id: string;
    readonly age: number;
    readonly area: Rect;
    readonly dirty: boolean;
    arrange(area: Rect): any;
}
export interface CompositionElement extends CompositionFragment {
    draw(callback: (gfx: CanvasRenderingContext2D) => void): any;
}
export interface CompositionRegion extends CompositionFragment {
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
