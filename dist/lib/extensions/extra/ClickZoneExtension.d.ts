import { GridKernel } from '../../ui/GridKernel';
import { GridElement, GridExtension, GridMouseEvent } from '../../ui/GridElement';
import { RectLike } from '../../geom/Rect';
export declare type ClickZoneMode = 'abs' | 'abs-alt' | 'rel';
export interface ClickZone extends RectLike {
    mode: ClickZoneMode;
    type: string;
}
export interface ClickZoneMouseEvent extends GridMouseEvent {
    zone: ClickZone;
}
export declare class ClickZoneExtension implements GridExtension {
    private grid;
    private layer;
    private current;
    private lastGridPt;
    private readonly isSelecting;
    init(grid: GridElement, kernel: GridKernel): void;
    private createElements(target);
    private switchZone(czs, sourceEvent);
    private forwardLayerEvent(e);
    private onMouseMove(e);
    private onGlobalMouseMove(e);
    private test(cell, zone, pt);
}
