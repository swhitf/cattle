import { LabelVisual } from '../../vom/common/LabelVisual';
import { Border } from '../../vom/styling/Border';
import { Visual } from '../../vom/Visual';
export declare class NetVisual extends Visual {
    readonly canHost: boolean;
    readonly type: string;
    readonly label: LabelVisual;
    animateBorder: boolean;
    background: string;
    border: Border;
    protected borderOffset: any;
    private borderAnimation;
    constructor();
    render(gfx: CanvasRenderingContext2D): void;
    protected visualStyleDidChange(): void;
    protected notifyChange(property: string): void;
    private doAnimateBorder();
}
