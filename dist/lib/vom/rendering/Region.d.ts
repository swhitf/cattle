import { RectLike } from '../../geom/Rect';
import { CompositionElement, CompositionRegion } from './Composition';
import { Node } from './Node';
export declare class Region extends Node implements CompositionRegion {
    readonly type: string;
    left: number;
    top: number;
    width: number;
    height: number;
    arrange(rect: RectLike): any;
    arrange(left: number, top: number, width: number, height: number): any;
    getElement(id: string, z: number): CompositionElement;
    getRegion(id: string, z: number): CompositionRegion;
    endUpdate(): void;
    invalidate(): void;
    render(gfx: CanvasRenderingContext2D): void;
    private getNode(key, factory);
}
