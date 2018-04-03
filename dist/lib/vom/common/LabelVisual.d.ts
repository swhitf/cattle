import { Padding } from '../../geom/Padding';
import { Visual } from '../../vom/Visual';
import { Font } from '../styling/Font';
export declare class LabelVisual extends Visual {
    readonly canHost: boolean;
    readonly type: string;
    background: string;
    foreground: string;
    font: Font;
    padding: Padding;
    text: string;
    autoSize(): void;
    render(gfx: CanvasRenderingContext2D): void;
}
