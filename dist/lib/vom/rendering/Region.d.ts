import { Rect } from '../../geom/Rect';
import { CompositionElement, CompositionRegion } from './Composition';
import { Node } from './Node';
export declare class Region extends Node implements CompositionRegion {
    readonly type: string;
    private dirtyAreas;
    getElement(id: string, z: number): CompositionElement;
    getRegion(id: string, z: number): CompositionRegion;
    endUpdate(): void;
    invalidate(area: Rect): void;
    render(gfx: CanvasRenderingContext2D): void;
    private getNode(key, factory);
    private updateBuffer();
}
