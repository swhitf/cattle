import { GridCell } from '../model/GridCell';
import { Padding } from '../geom/Padding';
import { Border } from '../vom/styling/Border';
import { Font } from '../vom/styling/Font';
import { Visual } from '../vom/Visual';
export declare class CellVisual extends Visual {
    private cellStyles;
    readonly canHost: boolean;
    readonly type: string;
    ref: string;
    background: string;
    border: Border;
    color: string;
    font: Font;
    padding: Padding;
    text: string;
    update(cell: GridCell): void;
    render(gfx: CanvasRenderingContext2D): void;
}
