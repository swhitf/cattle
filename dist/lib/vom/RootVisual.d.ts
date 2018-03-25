import { Surface } from './Surface';
import { Visual } from './Visual';
export declare class RootVisual extends Visual {
    private owner;
    readonly canHost: boolean;
    readonly type: string;
    constructor(owner: Surface);
    readonly surface: Surface;
    isMounted(): boolean;
    render(gfx: CanvasRenderingContext2D): void;
}
