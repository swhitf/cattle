import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
export declare class ScrollerExtension {
    private scrollerWidth;
    private grid;
    private wedge;
    constructor(scrollerWidth?: number);
    init(grid: GridElement, kernel: GridKernel): void;
    private createElements();
    private alignElements();
    private onContainerScroll();
}
