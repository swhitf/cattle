import { Border } from '../../vom/styling/Border';
import { Visual } from '../../vom/Visual';
export declare class NetVisual extends Visual {
    readonly canHost: boolean;
    readonly type: string;
    background: string;
    border: Border;
    animateBorder: boolean;
    protected borderOffset: any;
    private borderAnimation;
    render(gfx: CanvasRenderingContext2D): void;
    protected visualStyleDidChange(): void;
    protected notifyChange(property: string): void;
    private doAnimateBorder();
}
