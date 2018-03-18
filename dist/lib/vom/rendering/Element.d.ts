import { Matrix } from '../../geom/Matrix';
import { CompositionElement } from './Composition';
import { Node } from './Node';
export declare class Element extends Node implements CompositionElement {
    readonly type: string;
    debug: string;
    width: number;
    height: number;
    mt: Matrix;
    dim(width: number, height: number): CompositionElement;
    draw(callback: (gfx: CanvasRenderingContext2D) => void): CompositionElement;
    transform(mt: Matrix): CompositionElement;
    render(gfx: CanvasRenderingContext2D): void;
}
