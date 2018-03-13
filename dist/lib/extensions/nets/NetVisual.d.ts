import { Border } from '../../vom/styling/Border';
import { Visual } from '../../vom/Visual';
export declare class NetVisual extends Visual {
    readonly canHost: boolean;
    readonly type: string;
    background: string;
    border: Border;
    render(gfx: CanvasRenderingContext2D): void;
}
