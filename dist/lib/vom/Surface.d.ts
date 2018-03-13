import { SimpleEventEmitter } from '../base/SimpleEventEmitter';
import { Point } from '../geom/Point';
import { CameraManager } from './CameraManager';
import { RefreshLoop } from './RefreshLoop';
import { Theme } from './styling/Theme';
import { Visual, VisualPredicate } from './Visual';
/**
 * Event List:
 *
 * keydown
 * keymove
 * keyup
 * mousedown
 * mousemove
 * mouseup
 * change
 * compose
 * scroll
 * render
 *
 */
export declare class Surface extends SimpleEventEmitter {
    readonly cameras: CameraManager;
    readonly root: Visual;
    readonly ticker: RefreshLoop;
    readonly view: HTMLCanvasElement;
    width: number;
    height: number;
    theme: Theme;
    private readonly sequence;
    private readonly buffers;
    private dirtyRender;
    private dirtySequence;
    private tracker;
    constructor(width?: number, height?: number);
    readonly renderRequired: boolean;
    render(): void;
    query(selector: string): Visual[];
    test(surfacePt: Point, filter?: VisualPredicate): Visual[];
    private performRender();
    private createCameraManager();
    private createBufferManager();
    private createRoot();
    private createView();
    private applyTheme(theme, visuals?);
    private notifyChange(property);
    private onViewMouseEvent(type, me);
    private onViewMouseDragEvent(me, distance);
    private onViewKeyEvent(type, ke);
    private onVisualCompose(e);
    private onVisualChange(e);
    private propagateEvent(se, stack);
}
