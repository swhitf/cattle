import { GridElement } from '../ui/GridElement';
import { GridKernel } from '../ui/GridKernel';
export declare class ScrollerExtension {
    private grid;
    private layer;
    private scrollerX;
    private scrollerY;
    private wedgeX;
    private wedgeY;
    init(grid: GridElement, kernel: GridKernel): void;
    private createElements(target);
    private alignElements();
    private onScrollHorizontal();
    private onScrollVertical();
}
