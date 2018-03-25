import { CompositionElement } from './Composition';
import { Node } from './Node';
export declare class Element extends Node implements CompositionElement {
    readonly type: string;
    draw(callback: (gfx: CanvasRenderingContext2D) => void): CompositionElement;
    render(gfx: CanvasRenderingContext2D): void;
}
